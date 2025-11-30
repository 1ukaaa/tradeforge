require("dotenv").config();
const { createClient } = require("@libsql/client");

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

const db = createClient({
    url: url || "file:local.db",
    authToken,
});

const init = async () => {
    console.log("Initializing discord_queue table...");
    try {
        await db.execute(`
      CREATE TABLE IF NOT EXISTS discord_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        payload TEXT NOT NULL,
        scheduledAt TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        error TEXT
      )
    `);
        console.log("Table discord_queue created successfully.");
    } catch (err) {
        console.error("Error creating table:", err);
    }
};

init();
