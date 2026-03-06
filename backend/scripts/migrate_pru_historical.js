/**
 * migrate_pru_historical.js
 *
 * Recalcule les PRU en utilisant les taux EUR/USD HISTORIQUES (taux à la date de chaque transaction).
 * Cela donne le "vrai" PRU EUR tel que l'utilisateur l'a payé.
 *
 * Run ONCE: node scripts/migrate_pru_historical.js
 */
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });

const db = require("../src/core/database");
const YahooFinance = require("yahoo-finance2").default;
const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey', 'ripHistorical'] });

// Cache des taux par date (YYYY-MM-DD)
const rateCache = {};

async function getHistoricalEurUsdRate(dateStr) {
    if (rateCache[dateStr]) return rateCache[dateStr];

    const date = new Date(dateStr);
    const period1 = new Date(date);
    period1.setDate(period1.getDate() - 3); // look back 3 days
    const period2 = new Date(date);
    period2.setDate(period2.getDate() + 1);

    try {
        const res = await yahooFinance.chart('EURUSD=X', {
            period1,
            period2,
            interval: '1d',
        });
        const quotes = res?.quotes || [];
        // Find the closest quote to our date
        const closest = quotes.filter(q => q.close).pop(); // last available
        if (closest && closest.close) {
            rateCache[dateStr] = closest.close;
            return closest.close;
        }
    } catch (e) {
        console.warn(`  ⚠️  Impossible de récupérer le taux pour ${dateStr}: ${e.message}`);
    }

    // Fallback: use a reasonable static rate based on date
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    let fallback = 1.09;
    if (year === 2022) fallback = 1.01;
    else if (year === 2023 && month <= 6) fallback = 1.08;
    else if (year === 2023 && month > 6) fallback = 1.09;
    else if (year === 2024 && month <= 6) fallback = 1.08;
    else if (year === 2024 && month > 6) fallback = 1.10;
    else if (year === 2025 && month <= 3) fallback = 1.05;
    else if (year === 2025 && month <= 6) fallback = 1.12;
    else if (year === 2025 && month <= 9) fallback = 1.12;
    else if (year === 2025) fallback = 1.05;
    else if (year === 2026) fallback = 1.04;

    console.warn(`  ⚠️  Fallback rate pour ${dateStr}: ${fallback}`);
    rateCache[dateStr] = fallback;
    return fallback;
}

function toEurHistorical(price, currency, eurToUsdRate) {
    if (!price) return 0;
    const cur = (currency || 'USD').toUpperCase();
    if (cur === 'EUR') return price;
    if (cur === 'USD') return price / eurToUsdRate;
    if (cur === 'GBP') return (price * 1.25) / eurToUsdRate;
    return price / eurToUsdRate;
}

async function main() {
    // Load all unique investment_ids that have non-EUR transactions
    const txRes = await db.execute(`
        SELECT it.*, i.currency as inv_currency
        FROM investment_transactions it
        JOIN investments i ON i.id = it.investment_id
        ORDER BY it.investment_id, it.tx_date ASC, it.created_at ASC
    `);
    const allTx = txRes.rows || [];

    // Group by investment_id
    const byInv = {};
    for (const tx of allTx) {
        if (!byInv[tx.investment_id]) byInv[tx.investment_id] = [];
        byInv[tx.investment_id].push(tx);
    }

    // Get all investments for reference
    const invRes = await db.execute(`SELECT * FROM investments`);
    const investments = {};
    for (const inv of invRes.rows) investments[inv.id] = inv;

    console.log(`\n🔄 Recalcul PRU historique pour ${Object.keys(byInv).length} positions...\n`);

    for (const [invId, txs] of Object.entries(byInv)) {
        const inv = investments[invId];
        if (!inv) continue;

        let totalQty = 0;
        let totalCostEur = 0;

        for (const tx of txs) {
            const q = parseFloat(tx.quantity);
            const p = parseFloat(tx.price);
            const txCur = tx.currency || inv.inv_currency || 'USD';
            const txDate = tx.tx_date ? tx.tx_date.split('T')[0] : null;

            let pEur;
            if (txCur.toUpperCase() === 'EUR') {
                pEur = p;
            } else {
                const rate = txDate ? await getHistoricalEurUsdRate(txDate) : 1.09;
                pEur = toEurHistorical(p, txCur, rate);
            }

            if (tx.type === 'buy') {
                totalCostEur += q * pEur;
                totalQty += q;
            } else if (tx.type === 'sell') {
                if (totalQty > 0) {
                    const pruEur = totalCostEur / totalQty;
                    totalCostEur -= q * pruEur;
                }
                totalQty -= q;
            }
        }

        const newAvgPriceEur = totalQty > 0 ? totalCostEur / totalQty : 0;
        const oldAvgPrice = parseFloat(inv.average_price);

        await db.execute({
            sql: `UPDATE investments SET average_price = ?, currency = 'EUR', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
            args: [parseFloat(newAvgPriceEur.toFixed(6)), invId],
        });

        console.log(`  ✅ ${(inv.ticker || '???').padEnd(12)} | ancien: ${oldAvgPrice.toFixed(4)} ${inv.currency} → nouveau PRU: ${newAvgPriceEur.toFixed(4)} EUR (qty: ${totalQty.toFixed(4)})`);
    }

    console.log("\n✅ Migration historique terminée.");
    process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
