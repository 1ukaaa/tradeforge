// backend/src/services/journal.service.js
const db = require("../core/database");
const { serializeMetadata, parseMetadata } = require("../core/utils");

// Note l'ajout de "async" devant la fonction
const getJournalEntryById = async (id) => {
  // Syntaxe Turso : db.execute({ sql: "...", args: [...] })
  const result = await db.execute({
    sql: "SELECT * FROM entries WHERE id = ?",
    args: [id]
  });
  
  // Turso renvoie un tableau 'rows'. S'il est vide, c'est null.
  const row = result.rows[0];
  if (!row) return null;
  
  return { ...row, metadata: parseMetadata(row.metadata) };
};

const insertJournalEntry = async ({ type, content, plan, transcript, metadata, createdAt }) => {
  const timestamp = createdAt || new Date().toISOString();
  
  const result = await db.execute({
    sql: "INSERT INTO entries (type, content, plan, transcript, metadata, createdAt) VALUES (?, ?, ?, ?, ?, ?)",
    args: [type, content, plan || "", transcript || "", serializeMetadata(metadata), timestamp]
  });

  // Pour récupérer l'ID inséré avec LibSQL, c'est lastInsertRowid (attention c'est un BigInt parfois, on convertit)
  return getJournalEntryById(Number(result.lastInsertRowid));
};

const updateJournalEntry = async ({ id, type, content, plan, transcript, metadata }) => {
  const result = await db.execute({
    sql: "UPDATE entries SET type = ?, content = ?, plan = ?, transcript = ?, metadata = ? WHERE id = ?",
    args: [type, content, plan || "", transcript || "", serializeMetadata(metadata), id]
  });

  if (result.rowsAffected === 0) {
    return null;
  }
  return getJournalEntryById(id);
};

const deleteJournalEntry = async (id) => {
  const result = await db.execute({
    sql: "DELETE FROM entries WHERE id = ?",
    args: [id]
  });
  return result.rowsAffected > 0;
};

const getJournalEntries = async () => {
  const result = await db.execute("SELECT * FROM entries ORDER BY createdAt DESC");
  return result.rows.map((row) => ({
    ...row,
    metadata: parseMetadata(row.metadata),
  }));
};

module.exports = {
  getJournalEntryById,
  insertJournalEntry,
  updateJournalEntry,
  deleteJournalEntry,
  getJournalEntries,
};