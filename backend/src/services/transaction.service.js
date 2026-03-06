const db = require("../core/database");
const YahooFinance = require("yahoo-finance2").default;
const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey', 'ripHistorical'] });

// ── Fetch EUR/USD rate (live) ─────────────────────────────────────
async function fetchEurToUsdRate() {
    try {
        const q = await yahooFinance.quote('EURUSD=X');
        return (q && q.regularMarketPrice) ? q.regularMarketPrice : 1.09;
    } catch {
        return 1.09;
    }
}

// ── Convert native-currency price to EUR ──────────────────────────
function toEurNow(price, currency, eurToUsdRate) {
    if (!price) return 0;
    const cur = (currency || 'USD').toUpperCase();
    if (cur === 'EUR') return price;
    if (cur === 'USD') return price / eurToUsdRate;
    // GBp (pence) → GBP → EUR via ~1.25 GBP/USD
    if (cur === 'GBP') return (price * 1.25) / eurToUsdRate;
    if (cur === 'GBP' || currency === 'GBp') return (price / 100 * 1.25) / eurToUsdRate;
    return price / eurToUsdRate; // fallback
}

// ── Auto-create transactions table if not exists ──────────────────
async function initTransactionsTable() {
    await db.execute(`
        CREATE TABLE IF NOT EXISTS investment_transactions (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            investment_id INTEGER NOT NULL,
            ticker      TEXT NOT NULL,
            type        TEXT NOT NULL CHECK(type IN ('buy','sell')),
            quantity    REAL NOT NULL,
            price       REAL NOT NULL,
            currency    TEXT NOT NULL DEFAULT 'USD',
            tx_date     TEXT,
            notes       TEXT,
            created_at  TEXT DEFAULT CURRENT_TIMESTAMP
        )
    `);
}
initTransactionsTable().catch(console.error);

// ── Get all transactions for an investment ────────────────────────
async function getTransactions(investmentId) {
    const result = await db.execute({
        sql: `SELECT * FROM investment_transactions
              WHERE investment_id = ?
              ORDER BY tx_date DESC, created_at DESC`,
        args: [investmentId],
    });
    return result.rows || [];
}

// ── Get all transactions (for full history view) ──────────────────
async function getAllTransactions() {
    const result = await db.execute(
        `SELECT * FROM investment_transactions ORDER BY tx_date DESC, created_at DESC`
    );
    return result.rows || [];
}

// ── Add a transaction and update parent investment ─────────────────
async function addTransaction(investmentId, data) {
    const { type, quantity, price, currency, tx_date, notes } = data;

    // Fetch current investment state
    const invRes = await db.execute({
        sql: `SELECT * FROM investments WHERE id = ?`,
        args: [investmentId],
    });
    const inv = invRes.rows?.[0];
    if (!inv) throw new Error("Investment not found");

    const ticker = inv.ticker;

    // Insert transaction record
    const txResult = await db.execute({
        sql: `INSERT INTO investment_transactions
              (investment_id, ticker, type, quantity, price, currency, tx_date, notes)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
            investmentId, ticker, type,
            parseFloat(quantity), parseFloat(price),
            currency || inv.currency || 'USD',
            tx_date || null, notes || null
        ],
    });

    // Recalculate the investment position
    // We must re-derive the position from all transactions to keep PRU accurate
    const allTx = await db.execute({
        sql: `SELECT * FROM investment_transactions
              WHERE investment_id = ?
              ORDER BY tx_date ASC, created_at ASC`,
        args: [investmentId],
    });

    // ── Fetch current EUR/USD rate to store PRU in EUR ────────────────
    const eurToUsdRate = await fetchEurToUsdRate();

    let totalQty = 0;
    let totalCost = 0; // sum of qty × price in EUR

    for (const tx of allTx.rows) {
        const q = parseFloat(tx.quantity);
        const p = parseFloat(tx.price);
        const txCurrency = tx.currency || inv.currency || 'USD';
        const pEur = toEurNow(p, txCurrency, eurToUsdRate);

        if (tx.type === 'buy') {
            totalCost += q * pEur;  // cost in EUR
            totalQty += q;
        } else if (tx.type === 'sell') {
            // PRU stays the same on sell, cost proportionally reduces
            if (totalQty > 0) {
                const pruEur = totalCost / totalQty;
                totalCost -= q * pruEur;
            }
            totalQty -= q;
        }
    }

    const newQty = Math.max(0, parseFloat(totalQty.toFixed(8)));
    // PRU stocké en EUR, currency forcé à 'EUR' pour éviter double conversion à l'affichage
    const newAvgPriceEur = totalQty > 0 ? totalCost / totalQty : toEurNow(parseFloat(inv.average_price), inv.currency || 'USD', eurToUsdRate);

    // Update the investment record — PRU en EUR, currency = 'EUR'
    await db.execute({
        sql: `UPDATE investments
              SET quantity = ?, average_price = ?, currency = 'EUR', updated_at = CURRENT_TIMESTAMP
              WHERE id = ?`,
        args: [newQty, parseFloat(newAvgPriceEur.toFixed(6)), investmentId],
    });

    return { id: txResult.lastInsertRowid?.toString(), newQty, newAvgPrice: newAvgPriceEur };
}

// ── Delete a transaction (and recompute investment) ───────────────
async function deleteTransaction(txId) {
    // Find the investment_id first
    const txRes = await db.execute({
        sql: `SELECT * FROM investment_transactions WHERE id = ?`,
        args: [txId],
    });
    const tx = txRes.rows?.[0];
    if (!tx) throw new Error("Transaction not found");

    // Delete it
    await db.execute({
        sql: `DELETE FROM investment_transactions WHERE id = ?`,
        args: [txId],
    });

    // Recompute position from remaining transactions
    const allTx = await db.execute({
        sql: `SELECT * FROM investment_transactions
              WHERE investment_id = ?
              ORDER BY tx_date ASC, created_at ASC`,
        args: [tx.investment_id],
    });

    // Fetch original investment to know native currency
    const parentInvRes = await db.execute({
        sql: `SELECT * FROM investments WHERE id = ?`,
        args: [tx.investment_id],
    });
    const parentInv = parentInvRes.rows?.[0] || {};

    const eurToUsdRate = await fetchEurToUsdRate();

    let totalQty = 0;
    let totalCost = 0; // in EUR
    let firstPriceEur = null;

    for (const t of allTx.rows) {
        const q = parseFloat(t.quantity);
        const p = parseFloat(t.price);
        const txCurrency = t.currency || parentInv.currency || 'USD';
        const pEur = toEurNow(p, txCurrency, eurToUsdRate);
        if (firstPriceEur === null) firstPriceEur = pEur;

        if (t.type === 'buy') {
            totalCost += q * pEur;
            totalQty += q;
        } else if (t.type === 'sell') {
            if (totalQty > 0) {
                const pruEur = totalCost / totalQty;
                totalCost -= q * pruEur;
            }
            totalQty -= q;
        }
    }

    const newQty = Math.max(0, parseFloat(totalQty.toFixed(8)));
    const newAvgPriceEur = totalQty > 0 ? totalCost / totalQty : (firstPriceEur || 0);

    await db.execute({
        sql: `UPDATE investments
              SET quantity = ?, average_price = ?, currency = 'EUR', updated_at = CURRENT_TIMESTAMP
              WHERE id = ?`,
        args: [newQty, parseFloat(newAvgPriceEur.toFixed(6)), tx.investment_id],
    });

    return { success: true };
}

module.exports = {
    getTransactions,
    getAllTransactions,
    addTransaction,
    deleteTransaction,
};
