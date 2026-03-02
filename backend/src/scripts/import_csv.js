// ============================================================
// import_csv.js  —  one-shot import of Delta CSV into TradeForge
// Run: node import_csv.js
// ============================================================
require("dotenv").config({ path: "./.env" });
const { createClient } = require("@libsql/client");
const fs = require("fs");
const path = require("path");

// ── DB connection ────────────────────────────────────────────
const db = createClient({
    url: process.env.TURSO_DATABASE_URL || "file:local.db",
    authToken: process.env.TURSO_AUTH_TOKEN,
});

// ── CSV path ─────────────────────────────────────────────────
const CSV_PATH = "/Users/lukamauvignant/Documents/tradeforge/delta_Wallet Bourse_020302026_19.csv";

// ── Ticker mapping: Delta ticker → Yahoo Finance ticker ──────
// Delta sometimes uses exchange-suffixed tickers already; fix mismatches
const TICKER_MAP = {
    "500E.SW": "500E.SW",
    "ASML.AS": "ASML.AS",
    "C40.PA": "C40.PA",
    "ESE.PA": "ESE.PA",
    "ITP.PA": "ITP.PA",
    "OPM.PA": "OPM.PA",
    "RI.PA": "RI.PA",
    // All others follow their raw ticker as-is
};

function mapTicker(raw) {
    return TICKER_MAP[raw] || raw;
}

// ── Parse CSV ─────────────────────────────────────────────────
function parseCSV(filePath) {
    const content = fs.readFileSync(filePath, "utf8");
    const lines = content.trim().split("\n");
    const headers = lines[0].replace(/"/g, "").split(",");

    return lines.slice(1).map((line) => {
        // Proper CSV parse: handle commas inside quoted strings
        const cols = [];
        let inQuote = false;
        let cur = "";
        for (const ch of line) {
            if (ch === '"') { inQuote = !inQuote; continue; }
            if (ch === "," && !inQuote) { cols.push(cur); cur = ""; continue; }
            cur += ch;
        }
        cols.push(cur);

        const row = {};
        headers.forEach((h, i) => (row[h.trim()] = (cols[i] || "").trim()));
        return row;
    });
}

// ── Extract ticker from "GOOGL (Alphabet Inc)" → "GOOGL" ────
function extractTicker(baseNameStr) {
    const match = baseNameStr.match(/^([A-Z0-9.\-]+)\s*\(/);
    if (match) return match[1].trim();
    return baseNameStr.split(" ")[0].trim();
}

// ── Main ─────────────────────────────────────────────────────
async function main() {
    console.log("🗑️  Resetting investments & transactions tables...");

    // Clear both tables (keep schema intact)
    await db.execute("DELETE FROM investment_transactions");
    await db.execute("DELETE FROM investments");
    console.log("   ✅ Tables cleared.");

    const rows = parseCSV(CSV_PATH);
    console.log(`📂 Parsed ${rows.length} rows from CSV.\n`);

    // ── Build per-ticker transaction lists in order ───────────
    // key: raw ticker string from delta
    const byTicker = {}; // { ticker: [ {date, way, qty, price, currency} ] }
    const tickerMeta = {}; // { ticker: { name, type, exchange } }

    for (const row of rows) {
        const rawTicker = extractTicker(row["Base currency (name)"] || "");
        const ticker = mapTicker(rawTicker);
        const way = row["Way"];       // BUY | SELL
        const qty = parseFloat(row["Base amount"]);
        const amount = parseFloat(row["Quote amount"]); // total cost in quote currency
        const currency = (row["Quote currency"] || "USD").trim();
        const date = row["Date"] ? row["Date"].split("T")[0] : null;
        const exchange = row["Exchange"] || "";
        const baseType = row["Base type"] || "STOCK";
        const fullName = row["Base currency (name)"] || ticker;
        // Price per unit = total amount / qty
        const unitPrice = qty > 0 ? amount / qty : 0;

        if (!byTicker[ticker]) byTicker[ticker] = [];
        byTicker[ticker].push({ date, way, qty, unitPrice, currency, amount });

        if (!tickerMeta[ticker]) {
            tickerMeta[ticker] = {
                longName: fullName.replace(/^[A-Z0-9.\-]+\s*\(/, "").replace(/\)$/, ""),
                type: baseType,
                exchange,
                currency,
            };
        }
    }

    // ── For each ticker: compute current position + insert records ──
    let investmentCount = 0;
    let txCount = 0;
    const realizedGains = {}; // { ticker: totalRealizedPnL }

    for (const [ticker, txList] of Object.entries(byTicker)) {
        // Simulate position chronologically
        let totalQty = 0;
        let totalCost = 0; // sum of cost basis (buy qty × avg price)
        let realized = 0;
        const txCurrency = txList[0].currency; // dominant currency

        for (const tx of txList) {
            if (tx.way === "BUY") {
                totalCost += tx.qty * tx.unitPrice;
                totalQty += tx.qty;
            } else if (tx.way === "SELL") {
                if (totalQty > 0) {
                    const pru = totalCost / totalQty;
                    const gain = tx.qty * (tx.unitPrice - pru);
                    realized += gain;
                    totalCost -= tx.qty * pru; // reduce cost proportionally
                }
                totalQty -= tx.qty;
            }
        }

        totalQty = Math.max(0, parseFloat(totalQty.toFixed(8)));
        const avgPrice = totalQty > 0 ? totalCost / totalQty : 0;
        realizedGains[ticker] = realized;

        // Create investment record only if there's a remaining position
        if (totalQty > 0.000001) {
            const meta = tickerMeta[ticker];
            // Use buy_date = first buy for the investment record
            const firstBuy = txList.find(t => t.way === "BUY");
            const firstBuyDate = firstBuy?.date || null;

            const res = await db.execute({
                sql: `INSERT INTO investments (ticker, quantity, average_price, buy_date, currency)
                      VALUES (?, ?, ?, ?, ?)`,
                args: [ticker, totalQty, parseFloat(avgPrice.toFixed(6)), firstBuyDate, txCurrency],
            });
            const investmentId = Number(res.lastInsertRowid);
            investmentCount++;

            // Insert all transactions for this ticker
            for (const tx of txList) {
                await db.execute({
                    sql: `INSERT INTO investment_transactions
                          (investment_id, ticker, type, quantity, price, currency, tx_date, notes)
                          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    args: [
                        investmentId,
                        ticker,
                        tx.way.toLowerCase(),
                        tx.qty,
                        parseFloat(tx.unitPrice.toFixed(6)),
                        tx.currency,
                        tx.date,
                        tx.way === "SELL" ? `Vente — P&L réalisé: ${realized > 0 ? "+" : ""}${realized.toFixed(2)} ${tx.currency}` : null,
                    ],
                });
                txCount++;
            }

            console.log(
                `✅ ${ticker.padEnd(12)} | Qty: ${totalQty.toFixed(4).padStart(10)} | PRU: ${avgPrice.toFixed(2).padStart(8)} ${txCurrency}` +
                (realized !== 0 ? ` | P&L réalisé: ${realized > 0 ? "+" : ""}${realized.toFixed(2)} ${txCurrency}` : "")
            );
        } else {
            // Position closed — still insert transactions linked to a "ghost" investment
            // We insert the investment with qty=0 so history is visible, then it won't show in active holdings
            const meta = tickerMeta[ticker];
            const firstBuy = txList.find(t => t.way === "BUY");
            const firstBuyDate = firstBuy?.date || null;
            // Only insert if there were any buy transactions at all
            if (firstBuy) {
                const res = await db.execute({
                    sql: `INSERT INTO investments (ticker, quantity, average_price, buy_date, currency)
                          VALUES (?, ?, ?, ?, ?)`,
                    args: [ticker, 0, 0, firstBuyDate, txCurrency],
                });
                const investmentId = Number(res.lastInsertRowid);
                investmentCount++;

                for (const tx of txList) {
                    await db.execute({
                        sql: `INSERT INTO investment_transactions
                              (investment_id, ticker, type, quantity, price, currency, tx_date, notes)
                              VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                        args: [
                            investmentId,
                            ticker,
                            tx.way.toLowerCase(),
                            tx.qty,
                            parseFloat(tx.unitPrice.toFixed(6)),
                            tx.currency,
                            tx.date,
                            tx.way === "SELL" ? `Position clôturée — P&L réalisé: ${realized > 0 ? "+" : ""}${realized.toFixed(2)} ${tx.currency}` : null,
                        ],
                    });
                    txCount++;
                }

                console.log(
                    `📦 ${ticker.padEnd(12)} | Position CLÔTURÉE | P&L réalisé: ${realized > 0 ? "+" : ""}${realized.toFixed(2)} ${txCurrency}`
                );
            }
        }
    }

    console.log(`\n🎉 Import terminé !`);
    console.log(`   📊 ${investmentCount} positions créées (actives + clôturées)`);
    console.log(`   📋 ${txCount} transactions enregistrées`);
    console.log(`\n💰 Plus-values réalisées:`);
    Object.entries(realizedGains)
        .filter(([, v]) => v !== 0)
        .sort(([, a], [, b]) => b - a)
        .forEach(([t, g]) => console.log(`   ${t.padEnd(12)} ${g > 0 ? "+" : ""}${g.toFixed(2)}`));

    process.exit(0);
}

main().catch((err) => {
    console.error("❌ Erreur:", err);
    process.exit(1);
});
