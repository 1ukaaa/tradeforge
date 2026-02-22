const fs = require('fs');
const { parse } = require('csv-parse/sync');
const db = require('../src/core/database');

async function run() {
    console.log("Lecture du fichier CSV...");
    const fileContent = fs.readFileSync('/Users/lukamauvignant/Documents/tradeforge/delta_Wallet Bourse_220202026_1.csv', 'utf-8');

    console.log("Parsing du CSV...");
    const records = parse(fileContent, { columns: true, skip_empty_lines: true });

    const positions = {};

    console.log("Calcul des positions actuelles...");
    for (const record of records) {
        const way = record['Way'];
        const baseAmount = parseFloat(record['Base amount']);
        const quoteAmount = parseFloat(record['Quote amount']);
        const baseCurrencyName = record['Base currency (name)'];
        const quoteCurrency = record['Quote currency'];
        const dateStr = record['Date'];

        if (!baseCurrencyName) continue;

        const ticker = baseCurrencyName.split(' ')[0];

        if (!positions[ticker]) {
            positions[ticker] = {
                ticker,
                currency: quoteCurrency,
                quantity: 0,
                total_cost: 0,
                buy_date: dateStr,
            };
        }

        const pos = positions[ticker];

        // Mettre à jour la date d'achat la plus ancienne
        if (new Date(dateStr) < new Date(pos.buy_date)) {
            pos.buy_date = dateStr;
        }

        if (way === 'BUY') {
            pos.quantity += baseAmount;
            pos.total_cost += quoteAmount;
        } else if (way === 'SELL') {
            if (pos.quantity > 0) {
                const avgPrice = pos.total_cost / pos.quantity;
                pos.quantity -= baseAmount;
                pos.total_cost -= baseAmount * avgPrice;
            }
        }
    }

    console.log("Insertion dans la base de données...");
    for (const ticker in positions) {
        const pos = positions[ticker];
        // Ne conserver que les positions réellement détenues (quantité > 0)
        if (pos.quantity > 0.0001) {
            const avgPrice = pos.total_cost / pos.quantity;
            console.log(`-> Ajout de ${ticker}: Qté ${pos.quantity.toFixed(4)} | PRU ${avgPrice.toFixed(2)} ${pos.currency}`);

            await db.execute({
                sql: `INSERT INTO investments (ticker, quantity, average_price, buy_date, currency)
                      VALUES (?, ?, ?, ?, ?)`,
                args: [ticker, pos.quantity, avgPrice, pos.buy_date.split('T')[0], pos.currency || 'USD']
            });
        }
    }

    console.log("✅ Import terminé avec succès !");
}

run().catch(console.error);
