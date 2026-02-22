const db = require("../src/core/database");

async function up() {
    console.log("Migration: Création de la table investments...");
    try {
        await db.execute(`
      CREATE TABLE IF NOT EXISTS investments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ticker TEXT NOT NULL,
        quantity REAL NOT NULL,
        average_price REAL NOT NULL,
        buy_date TEXT,
        currency TEXT DEFAULT 'USD',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
        console.log("✅ Table investments créée ou déjà existante.");
    } catch (e) {
        console.error("Erreur lors de la migration:", e);
    }
}

up();
