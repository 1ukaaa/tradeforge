// backend/src/services/journal.service.js
const db = require("../core/database");
// MODIFICATION : Importer les utils partagés
const { serializeMetadata, parseMetadata } = require("../core/utils");

// --- Utils ---
// MODIFICATION : Les fonctions serializeMetadata et parseMetadata sont supprimées d'ici

// --- Service BDD ---

const getJournalEntryById = (id) => {
  const row = db.prepare("SELECT * FROM entries WHERE id = ?").get(id);
  if (!row) return null;
  return { ...row, metadata: parseMetadata(row.metadata) };
};

const insertJournalEntry = ({ type, content, plan, transcript, metadata, createdAt }) => {
  const timestamp = createdAt || new Date().toISOString();
  const stmt = db.prepare(
    "INSERT INTO entries (type, content, plan, transcript, metadata, createdAt) VALUES (?, ?, ?, ?, ?, ?)"
  );
  const info = stmt.run(type, content, plan || "", transcript || "", serializeMetadata(metadata), timestamp);
  return getJournalEntryById(info.lastInsertRowid);
};

const updateJournalEntry = ({ id, type, content, plan, transcript, metadata }) => {
  const stmt = db.prepare(
    "UPDATE entries SET type = ?, content = ?, plan = ?, transcript = ?, metadata = ? WHERE id = ?"
  );
  const info = stmt.run(
    type,
    content,
    plan || "",
    transcript || "",
    serializeMetadata(metadata),
    id
  );
  if (info.changes === 0) {
    return null;
  }
  return getJournalEntryById(id);
};

const deleteJournalEntry = (id) => {
  const stmt = db.prepare("DELETE FROM entries WHERE id = ?");
  const info = stmt.run(id);
  return info.changes > 0;
};

const getJournalEntries = () => {
  const rows = db.prepare("SELECT * FROM entries ORDER BY createdAt DESC").all();
  return rows.map((row) => ({
    ...row,
    metadata: parseMetadata(row.metadata),
  }));
};

// MODIFICATION : La fonction seedJournalEntries et journalSeed sont supprimées d'ici

module.exports = {
  getJournalEntryById,
  insertJournalEntry,
  updateJournalEntry,
  deleteJournalEntry,
  getJournalEntries,
  // MODIFICATION : On n'exporte plus seedJournalEntries
};