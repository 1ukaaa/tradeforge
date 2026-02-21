require("dotenv").config();
const { createClient } = require("@libsql/client");
const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
const db = createClient({ url, authToken });

const fix = async () => {
  try {
    await db.execute("ALTER TABLE entries ADD COLUMN metadata TEXT DEFAULT '{}'");
    console.log("metadata column added");
  } catch (e) {
    console.error("error:", e);
  }
};
fix();
