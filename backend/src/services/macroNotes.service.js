// backend/src/services/macroNotes.service.js
// MacroLens — Notes d'analyse fondamentale / insights Bloomberg
const db = require('../core/database');

const CREATE_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS macro_notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL DEFAULT '',
    content TEXT NOT NULL DEFAULT '',
    tags TEXT NOT NULL DEFAULT '[]',
    sentiment TEXT NOT NULL DEFAULT 'neutral',
    pinned INTEGER NOT NULL DEFAULT 0,
    source_handle TEXT DEFAULT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )
`;

let tableEnsured = false;
const ensureTable = async () => {
  if (tableEnsured) return;
  await db.execute(CREATE_TABLE_SQL);
  tableEnsured = true;
};

// ─── CRUD ─────────────────────────────────────────────────────────────────────

const getAllNotes = async () => {
  await ensureTable();
  const result = await db.execute(
    `SELECT * FROM macro_notes ORDER BY pinned DESC, updated_at DESC`
  );
  return result.rows.map(parseNote);
};

const createNote = async ({ title = '', content = '', tags = [], sentiment = 'neutral', pinned = false, source_handle = null }) => {
  await ensureTable();
  const now = new Date().toISOString();
  const result = await db.execute({
    sql: `INSERT INTO macro_notes (title, content, tags, sentiment, pinned, source_handle, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING *`,
    args: [title, content, JSON.stringify(tags), sentiment, pinned ? 1 : 0, source_handle, now, now],
  });
  return parseNote(result.rows[0]);
};

const updateNote = async (id, updates) => {
  await ensureTable();
  const now = new Date().toISOString();
  const fields = [];
  const args = [];
  if (updates.title !== undefined)          { fields.push('title = ?');          args.push(updates.title); }
  if (updates.content !== undefined)        { fields.push('content = ?');        args.push(updates.content); }
  if (updates.tags !== undefined)           { fields.push('tags = ?');           args.push(JSON.stringify(updates.tags)); }
  if (updates.sentiment !== undefined)      { fields.push('sentiment = ?');      args.push(updates.sentiment); }
  if (updates.pinned !== undefined)         { fields.push('pinned = ?');         args.push(updates.pinned ? 1 : 0); }
  if (updates.source_handle !== undefined)  { fields.push('source_handle = ?'); args.push(updates.source_handle); }
  fields.push('updated_at = ?');
  args.push(now);
  args.push(Number(id));
  const result = await db.execute({
    sql: `UPDATE macro_notes SET ${fields.join(', ')} WHERE id = ? RETURNING *`,
    args,
  });
  if (!result.rows.length) throw new Error('Note introuvable');
  return parseNote(result.rows[0]);
};

const deleteNote = async (id) => {
  await ensureTable();
  await db.execute({ sql: `DELETE FROM macro_notes WHERE id = ?`, args: [Number(id)] });
};

const parseNote = (row) => {
  if (!row) return null;
  return {
    ...row,
    tags: (() => { try { return JSON.parse(row.tags || '[]'); } catch { return []; } })(),
    pinned: Boolean(row.pinned),
  };
};

module.exports = { getAllNotes, createNote, updateNote, deleteNote };
