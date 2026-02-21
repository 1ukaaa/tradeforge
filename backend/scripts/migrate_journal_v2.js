require("dotenv").config();
const { createClient } = require("@libsql/client");

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

const db = createClient({
    url: url || "file:journal.db",
    authToken,
});

const migrateJournal = async () => {
    console.log("Starting DB Migration for Visual Journal...");

    try {
        console.log("Dropping old entries table...");
        await db.execute("DROP TABLE IF EXISTS entries");
        console.log("✓ Dropped old entries table");

        console.log("Creating new entries table...");
        await db.execute(`
            CREATE TABLE entries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                date TEXT NOT NULL,
                asset TEXT NOT NULL,
                direction TEXT NOT NULL,
                result TEXT NOT NULL,
                account TEXT,
                setup TEXT,
                images TEXT, -- JSON array of strings
                metadata TEXT DEFAULT '{}',
                createdAt TEXT DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log("✓ Created new entries table");

    } catch (err) {
        console.error("Migration failed:", err);
    }
};

migrateJournal();
