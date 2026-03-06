/**
 * migrate_pru_to_eur.js
 *
 * Migrates all investments whose currency != 'EUR' to store average_price in EUR.
 * Run ONCE: node scripts/migrate_pru_to_eur.js
 */
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });

const db = require("../src/core/database");
const YahooFinance = require("yahoo-finance2").default;
const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey', 'ripHistorical'] });

async function main() {
    // 1) Fetch live EUR/USD rate
    let eurToUsdRate = 1.09;
    try {
        const q = await yahooFinance.quote('EURUSD=X');
        if (q && q.regularMarketPrice) eurToUsdRate = q.regularMarketPrice;
    } catch (e) {
        console.warn("Could not fetch EUR/USD rate, using 1.09. Error:", e.message);
    }
    console.log(`EUR/USD rate: ${eurToUsdRate}`);

    // 2) Load all investments to migrate (non-EUR currencies, qty > 0, avg_price > 0)
    const res = await db.execute(
        `SELECT id, ticker, quantity, average_price, currency FROM investments WHERE currency != 'EUR'`
    );
    const rows = res.rows || [];
    console.log(`Found ${rows.length} investments to migrate.`);

    for (const inv of rows) {
        const cur = (inv.currency || 'USD').toUpperCase();
        let avgEur = parseFloat(inv.average_price);

        if (cur === 'USD') {
            avgEur = avgEur / eurToUsdRate;
        } else if (cur === 'GBP') {
            avgEur = (avgEur * 1.25) / eurToUsdRate;
        } else if (cur === 'GBP' /* pence */) {
            avgEur = (avgEur / 100 * 1.25) / eurToUsdRate;
        }
        // else: already EUR or unknown → keep as-is

        await db.execute({
            sql: `UPDATE investments SET average_price = ?, currency = 'EUR', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
            args: [parseFloat(avgEur.toFixed(6)), inv.id],
        });

        console.log(`  ✅ ${inv.ticker.padEnd(12)} | ${parseFloat(inv.average_price).toFixed(4)} ${cur} → ${avgEur.toFixed(4)} EUR`);
    }

    console.log("\nMigration terminée.");
    process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
