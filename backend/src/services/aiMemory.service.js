// backend/src/services/aiMemory.service.js
const db = require("../core/database");

const MAX_STORED_PER_SESSION = 30; // messages max conservés par session
const MAX_HISTORY_FOR_GEMINI = 10; // messages max envoyés à Gemini (contrôle tokens)
const DEFAULT_SESSION = "default";

// ─────────────────────────────────────────────────────────────────────────────
// MIGRATIONS / INIT
// ─────────────────────────────────────────────────────────────────────────────

const ensureTables = async () => {
    // Table des sessions
    await db.execute(`
    CREATE TABLE IF NOT EXISTS ai_sessions (
      id         TEXT    PRIMARY KEY,
      name       TEXT    NOT NULL,
      createdAt  TEXT    NOT NULL,
      updatedAt  TEXT    NOT NULL
    )
  `);

    // Table des messages
    await db.execute(`
    CREATE TABLE IF NOT EXISTS ai_messages (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      sessionId   TEXT    NOT NULL DEFAULT '${DEFAULT_SESSION}',
      role        TEXT    NOT NULL,
      text        TEXT    NOT NULL,
      createdAt   TEXT    NOT NULL,
      accounts    TEXT    DEFAULT NULL
    )
  `);

    // Migration : ajouter sessionId si colonne manquante (table pré-existante)
    try {
        await db.execute(`ALTER TABLE ai_messages ADD COLUMN sessionId TEXT DEFAULT '${DEFAULT_SESSION}'`);
    } catch (_) { /* colonne déjà présente */ }

};


// ─────────────────────────────────────────────────────────────────────────────
// SESSIONS
// ─────────────────────────────────────────────────────────────────────────────

const getSessions = async () => {
    await ensureTables();
    const result = await db.execute(`
    SELECT s.id, s.name, s.createdAt, s.updatedAt,
           COUNT(m.id) AS messageCount
    FROM   ai_sessions s
    LEFT JOIN ai_messages m ON m.sessionId = s.id
    GROUP  BY s.id
    ORDER  BY s.updatedAt DESC
  `);
    return result.rows;
};

const createSession = async ({ name }) => {
    await ensureTables();
    const id = `sess_${Date.now().toString(36)}`;
    const now = new Date().toISOString();
    const sessionName = name || "Nouveau chat";
    await db.execute({
        sql: `INSERT INTO ai_sessions (id, name, createdAt, updatedAt) VALUES (?, ?, ?, ?)`,
        args: [id, sessionName, now, now],
    });
    return { id, name: sessionName, createdAt: now, updatedAt: now, messageCount: 0 };
};

const renameSession = async (sessionId, name) => {
    await ensureTables();
    await db.execute({
        sql: `UPDATE ai_sessions SET name = ?, updatedAt = ? WHERE id = ?`,
        args: [name, new Date().toISOString(), sessionId],
    });
};

const deleteSession = async (sessionId) => {
    await ensureTables();
    await db.execute({ sql: `DELETE FROM ai_messages WHERE sessionId = ?`, args: [sessionId] });
    await db.execute({ sql: `DELETE FROM ai_sessions WHERE id = ?`, args: [sessionId] });
};

// ─────────────────────────────────────────────────────────────────────────────
// MESSAGES
// ─────────────────────────────────────────────────────────────────────────────

const getMessages = async (sessionId = DEFAULT_SESSION) => {
    await ensureTables();
    const result = await db.execute({
        sql: `SELECT * FROM ai_messages WHERE sessionId = ? ORDER BY id ASC`,
        args: [sessionId],
    });
    return result.rows.map(row => ({
        id: row.id,
        sessionId: row.sessionId,
        role: row.role,
        text: row.text,
        createdAt: row.createdAt,
        accounts: row.accounts ? JSON.parse(row.accounts) : null,
    }));
};

/**
 * Les N derniers messages d'une session au format { role, text } pour Gemini.
 */
const getHistoryForGemini = async (sessionId = DEFAULT_SESSION) => {
    await ensureTables();
    const result = await db.execute({
        sql: `SELECT role, text FROM ai_messages WHERE sessionId = ? ORDER BY id DESC LIMIT ?`,
        args: [sessionId, MAX_HISTORY_FOR_GEMINI],
    });
    return result.rows.reverse().map(row => ({ role: row.role, text: row.text }));
};

const saveMessage = async ({ sessionId = DEFAULT_SESSION, role, text, accounts = null }) => {
    await ensureTables();
    const now = new Date().toISOString();
    const accountsStr = accounts && accounts.length > 0 ? JSON.stringify(accounts) : null;

    await db.execute({
        sql: `INSERT INTO ai_messages (sessionId, role, text, createdAt, accounts) VALUES (?, ?, ?, ?, ?)`,
        args: [sessionId, role, text, now, accountsStr],
    });

    // Auto-nommer la session avec le premier message utilisateur
    if (role === "user") {
        const countResult = await db.execute({
            sql: `SELECT COUNT(*) as cnt FROM ai_messages WHERE sessionId = ? AND role = 'user'`,
            args: [sessionId],
        });
        const isFirst = Number(countResult.rows[0]?.cnt) === 1;
        if (isFirst) {
            const autoName = text.slice(0, 45) + (text.length > 45 ? "…" : "");
            await db.execute({
                sql: `UPDATE ai_sessions SET name = ?, updatedAt = ? WHERE id = ? AND name = 'Nouveau chat'`,
                args: [autoName, now, sessionId],
            });
        }
    }

    // Mise à jour updatedAt de la session
    await db.execute({
        sql: `UPDATE ai_sessions SET updatedAt = ? WHERE id = ?`,
        args: [now, sessionId],
    });

    // Rolling : supprimer les messages en surplus pour cette session
    await db.execute({
        sql: `
      DELETE FROM ai_messages
      WHERE sessionId = ?
      AND id NOT IN (
        SELECT id FROM ai_messages WHERE sessionId = ? ORDER BY id DESC LIMIT ?
      )
    `,
        args: [sessionId, sessionId, MAX_STORED_PER_SESSION],
    });
};

const clearSession = async (sessionId = DEFAULT_SESSION) => {
    await ensureTables();
    await db.execute({ sql: `DELETE FROM ai_messages WHERE sessionId = ?`, args: [sessionId] });
    await db.execute({
        sql: `UPDATE ai_sessions SET updatedAt = ? WHERE id = ?`,
        args: [new Date().toISOString(), sessionId],
    });
};

module.exports = {
    ensureTables,
    getSessions,
    createSession,
    renameSession,
    deleteSession,
    getMessages,
    getHistoryForGemini,
    saveMessage,
    clearSession,
};
