// backend/src/services/journal.service.js
const db = require("../core/database");

const getJournalEntryById = async (id) => {
  const result = await db.execute({
    sql: "SELECT * FROM entries WHERE id = ?",
    args: [id]
  });

  const row = result.rows[0];
  if (!row) return null;

  return {
    ...row,
    images: row.images ? JSON.parse(row.images) : []
  };
};

const insertJournalEntry = async ({ date, asset, direction, result_outcome, account, setup, images, trade_id }) => {
  const timestamp = new Date().toISOString();
  const imagesStr = Array.isArray(images) ? JSON.stringify(images) : "[]";

  const result = await db.execute({
    sql: "INSERT INTO entries (date, asset, direction, result, account, setup, images, createdAt, trade_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    args: [date || timestamp, asset || "", direction || "", result_outcome || "", account || "", setup || "", imagesStr, timestamp, trade_id || null]
  });

  return getJournalEntryById(Number(result.lastInsertRowid));
};

const updateJournalEntry = async ({ id, date, asset, direction, result_outcome, account, setup, images, trade_id }) => {
  const imagesStr = Array.isArray(images) ? JSON.stringify(images) : "[]";
  const result = await db.execute({
    sql: "UPDATE entries SET date = ?, asset = ?, direction = ?, result = ?, account = ?, setup = ?, images = ?, trade_id = ? WHERE id = ?",
    args: [date, asset, direction, result_outcome, account, setup, imagesStr, trade_id || null, id]
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
  const result = await db.execute("SELECT * FROM entries ORDER BY date DESC, createdAt DESC");
  return result.rows.map((row) => ({
    ...row,
    images: row.images ? JSON.parse(row.images) : [],
  }));
};

module.exports = {
  getJournalEntryById,
  insertJournalEntry,
  updateJournalEntry,
  deleteJournalEntry,
  getJournalEntries,
};