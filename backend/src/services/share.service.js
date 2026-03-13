// backend/src/services/share.service.js
const crypto = require("crypto");
const db = require("../core/database");

// ─── Initialisation de la table ─────────────────────────────────────
const ensureTable = async () => {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS share_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      token TEXT NOT NULL UNIQUE,
      label TEXT DEFAULT '',
      pin_hash TEXT NOT NULL,
      is_active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL,
      last_accessed_at TEXT
    )
  `);
};

const tableReady = ensureTable();

// ─── Helpers ────────────────────────────────────────────────────────
const generateToken = () => crypto.randomBytes(24).toString("base64url");

const hashPin = (pin) =>
  crypto.createHash("sha256").update(String(pin)).digest("hex");

// ─── Service methods ────────────────────────────────────────────────

/**
 * Crée un nouveau lien de partage avec un PIN.
 */
const createShareLink = async ({ pin, label = "" }) => {
  await tableReady;
  const token = generateToken();
  const pinH = hashPin(pin);
  const now = new Date().toISOString();

  await db.execute({
    sql: `INSERT INTO share_tokens (token, label, pin_hash, is_active, created_at) VALUES (?, ?, ?, 1, ?)`,
    args: [token, label, pinH, now],
  });

  return { token, label, created_at: now };
};

/**
 * Liste tous les liens de partage (pour le propriétaire).
 */
const listShareLinks = async () => {
  await tableReady;
  const result = await db.execute(
    `SELECT id, token, label, is_active, created_at, last_accessed_at FROM share_tokens ORDER BY created_at DESC`
  );
  return result.rows;
};

/**
 * Révoque (désactive) un lien de partage.
 */
const revokeShareLink = async (id) => {
  await tableReady;
  const result = await db.execute({
    sql: `UPDATE share_tokens SET is_active = 0 WHERE id = ?`,
    args: [id],
  });
  return result.rowsAffected > 0;
};

/**
 * Supprime un lien de partage.
 */
const deleteShareLink = async (id) => {
  await tableReady;
  const result = await db.execute({
    sql: `DELETE FROM share_tokens WHERE id = ?`,
    args: [id],
  });
  return result.rowsAffected > 0;
};

/**
 * Valide un token + PIN. Retourne `true` si OK, `false` sinon.
 * Met aussi à jour `last_accessed_at`.
 */
const validateAccess = async (token, pin) => {
  await tableReady;
  const result = await db.execute({
    sql: `SELECT id, pin_hash, is_active FROM share_tokens WHERE token = ?`,
    args: [token],
  });
  const row = result.rows[0];
  if (!row) return { valid: false, reason: "not_found" };
  if (!row.is_active) return { valid: false, reason: "revoked" };

  const pinH = hashPin(pin);
  if (pinH !== row.pin_hash) return { valid: false, reason: "wrong_pin" };

  // Update last accessed
  await db.execute({
    sql: `UPDATE share_tokens SET last_accessed_at = ? WHERE id = ?`,
    args: [new Date().toISOString(), row.id],
  });

  return { valid: true };
};

/**
 * Vérifie juste si le token existe et est actif (pour savoir s'il faut demander le PIN).
 */
const tokenExists = async (token) => {
  await tableReady;
  const result = await db.execute({
    sql: `SELECT id, is_active, label FROM share_tokens WHERE token = ?`,
    args: [token],
  });
  const row = result.rows[0];
  if (!row) return { exists: false };
  return { exists: true, active: !!row.is_active, label: row.label };
};

module.exports = {
  createShareLink,
  listShareLinks,
  revokeShareLink,
  deleteShareLink,
  validateAccess,
  tokenExists,
};
