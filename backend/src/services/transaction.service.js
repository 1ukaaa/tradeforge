const db = require("../core/database");

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

    let totalQty = 0;
    let totalCost = 0; // sum of qty × price for buys

    for (const tx of allTx.rows) {
        const q = parseFloat(tx.quantity);
        const p = parseFloat(tx.price);
        if (tx.type === 'buy') {
            totalCost += q * p;
            totalQty += q;
        } else if (tx.type === 'sell') {
            // PRU stays the same on sell, cost proportionally reduces
            if (totalQty > 0) {
                const pru = totalCost / totalQty;
                totalCost -= q * pru;
            }
            totalQty -= q;
        }
    }

    const newQty = Math.max(0, parseFloat(totalQty.toFixed(8)));
    const newAvgPrice = totalQty > 0 ? totalCost / totalQty : inv.average_price;

    // Update the investment record
    await db.execute({
        sql: `UPDATE investments
              SET quantity = ?, average_price = ?, updated_at = CURRENT_TIMESTAMP
              WHERE id = ?`,
        args: [newQty, parseFloat(newAvgPrice.toFixed(6)), investmentId],
    });

    return { id: txResult.lastInsertRowid?.toString(), newQty, newAvgPrice };
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

    let totalQty = 0;
    let totalCost = 0;
    let firstPrice = null;

    for (const t of allTx.rows) {
        const q = parseFloat(t.quantity);
        const p = parseFloat(t.price);
        if (firstPrice === null) firstPrice = p;
        if (t.type === 'buy') {
            totalCost += q * p;
            totalQty += q;
        } else if (t.type === 'sell') {
            if (totalQty > 0) {
                const pru = totalCost / totalQty;
                totalCost -= q * pru;
            }
            totalQty -= q;
        }
    }

    const newQty = Math.max(0, parseFloat(totalQty.toFixed(8)));
    const newAvgPrice = totalQty > 0 ? totalCost / totalQty : (firstPrice || 0);

    await db.execute({
        sql: `UPDATE investments
              SET quantity = ?, average_price = ?, updated_at = CURRENT_TIMESTAMP
              WHERE id = ?`,
        args: [newQty, parseFloat(newAvgPrice.toFixed(6)), tx.investment_id],
    });

    return { success: true };
}

module.exports = {
    getTransactions,
    getAllTransactions,
    addTransaction,
    deleteTransaction,
};
