require("dotenv").config();
const { createClient } = require("@libsql/client");

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

const db = createClient({
    url: url || "file:journal.db", // Pointing to the main DB file seen in file list
    authToken,
});

const migrate = async () => {
    console.log("Starting DB Migration for Studio Unification...");

    try {
        // 1. Twitter: Add scheduledAt column if it acts as the main store
        console.log("Migrating Twitter Drafts...");
        try {
            await db.execute("ALTER TABLE twitter_drafts ADD COLUMN scheduledAt TEXT");
            console.log("✓ Added scheduledAt to twitter_drafts");
        } catch (e) {
            if (e.message.includes("duplicate column")) {
                console.log("ℹ scheduledAt already exists in twitter_drafts");
            } else {
                console.log("ℹ Note on Twitter Migration:", e.message);
            }
        }

        // 2. Discord: Create discord_drafts table
        console.log("Creating Discord Drafts table...");
        await db.execute(`
      CREATE TABLE IF NOT EXISTS discord_drafts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        variant TEXT DEFAULT 'trade.simple',
        status TEXT DEFAULT 'draft', -- draft, scheduled, published, failed
        payload TEXT, -- JSON content
        entry_id INTEGER, -- Link to journal entry if any
        metadata TEXT, -- JSON metadata
        scheduledAt TEXT,
        publishedAt TEXT,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);
        console.log("✓ Created discord_drafts table");

    } catch (err) {
        console.error("Migration failed:", err);
    }
};

migrate();
