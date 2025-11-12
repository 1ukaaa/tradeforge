// backend/src/core/database.js
const path = require("path");
const Database = require("better-sqlite3");
const { DEFAULT_PLAN } = require("../config/plan.config");
const { 
  DEFAULT_STRUCTURE_TEMPLATES, 
  DEFAULT_PROMPT_VARIANTS, 
  DEFAULT_STRUCTURED_VARIANT 
} = require("../config/prompts");
// MODIFICATION : Importer les utils et les données de seed
const { journalSeed } = require("../config/seed.config");
const { serializeMetadata } = require("./utils"); 

// --- Configuration de la BDD ---
const DB_PATH = path.resolve(__dirname, "../../journal.db");
const db = new Database(DB_PATH);

// --- Fonctions d'initialisation de schéma ---

function initJournal() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      content TEXT NOT NULL,
      plan TEXT,
      transcript TEXT,
      metadata TEXT,
      createdAt TEXT NOT NULL
    )
  `);
}

// MODIFICATION : La logique de seeding vit ici maintenant
function seedJournalEntries() {
  const { count } = db.prepare("SELECT COUNT(*) as count FROM entries").get();
  if (!count) {
    console.log("Seeding des entrées du journal...");
    const stmt = db.prepare(
      "INSERT INTO entries (type, content, plan, transcript, metadata, createdAt) VALUES (?, ?, ?, ?, ?, ?)"
    );
    
    // On utilise les données de seed.config.js
    journalSeed.forEach((entry) => {
      stmt.run(
        entry.type,
        entry.content,
        entry.plan || "",
        entry.transcript || "",
        serializeMetadata(entry.metadata), // On utilise le helper de utils.js
        entry.createdAt || new Date().toISOString()
      );
    });
  }
}

function initPlanConfig() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS plans (
      id INTEGER PRIMARY KEY,
      data TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
  `);
  const { count } = db.prepare("SELECT COUNT(*) as count FROM plans").get();
  if (!count) {
    const timestamp = new Date().toISOString();
    const stmt = db.prepare("INSERT INTO plans (id, data, updatedAt) VALUES (1, ?, ?)");
    stmt.run(JSON.stringify(DEFAULT_PLAN), timestamp);
  }
}

function initStructuredTemplates() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS structured_templates (
      variant TEXT PRIMARY KEY,
      prompt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
  `);
  const stmt = db.prepare("SELECT variant FROM structured_templates WHERE variant = ?");
  Object.entries(DEFAULT_STRUCTURE_TEMPLATES).forEach(([variant, prompt]) => {
    const exists = stmt.get(variant);
    if (!exists) {
      const timestamp = new Date().toISOString();
      db.prepare(
        "INSERT INTO structured_templates (variant, prompt, updatedAt) VALUES (?, ?, ?)"
      ).run(variant, prompt, timestamp);
    }
  });
}

function initPromptVariants() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS prompt_variants (
      type TEXT NOT NULL,
      variant TEXT NOT NULL,
      prompt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      PRIMARY KEY (type, variant)
    );
  `);
  const selectStmt = db.prepare("SELECT variant FROM prompt_variants WHERE type = ? AND variant = ?");
  Object.entries(DEFAULT_PROMPT_VARIANTS).forEach(([type, variants]) => {
    Object.entries(variants).forEach(([variant, prompt]) => {
      const exists = selectStmt.get(type, variant);
      if (!exists) {
        const timestamp = new Date().toISOString();
        db.prepare(
          "INSERT INTO prompt_variants (type, variant, prompt, updatedAt) VALUES (?, ?, ?, ?)"
        ).run(type, variant, prompt, timestamp);
      }
    });
  });
}

function initSettingsTable() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
  const defaults = {
    structured_variant: DEFAULT_STRUCTURED_VARIANT,
    analysis_variant: "default",
    trade_variant: "default",
  };
  Object.entries(defaults).forEach(([key, value]) => {
    const exists = db.prepare("SELECT value FROM settings WHERE key = ?").get(key);
    if (!exists) {
      db.prepare("INSERT INTO settings (key, value) VALUES (?, ?)").run(key, JSON.stringify({ value }));
    }
  });
}

// --- Initialisation ---
function initializeDatabase() {
  console.log("Initialisation de la base de données...");
  initJournal();
  initPlanConfig();
  initSettingsTable();
  initStructuredTemplates();
  initPromptVariants();
  
  // MODIFICATION : On appelle la fonction de seeding locale
  seedJournalEntries(); 
  
  console.log("Base de données prête.");
  // MODIFICATION : On retire setImmediate, plus besoin
}

// Exécute l'initialisation
initializeDatabase();

// Exporte l'instance de la BDD
module.exports = db;