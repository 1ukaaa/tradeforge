const db = require("../core/database");

const parseSettingValue = (rawValue) => {
  try {
    const parsed = JSON.parse(rawValue);
    return parsed?.value !== undefined ? parsed.value : parsed;
  } catch {
    return rawValue;
  }
};

const mapPromptRow = (row) =>
  row
    ? {
        type: row.type,
        variant: row.variant,
        prompt: row.prompt,
        updatedAt: row.updatedAt,
      }
    : null;

const mapTemplateRow = (row) =>
  row
    ? {
        variant: row.variant,
        prompt: row.prompt,
        updatedAt: row.updatedAt,
      }
    : null;

// --- App settings ---

const getSetting = async (key) => {
  const result = await db.execute({
    sql: "SELECT value FROM settings WHERE key = ?",
    args: [key],
  });
  const row = result.rows[0];
  if (!row) return null;
  return { key, value: parseSettingValue(row.value) };
};

const getSettings = async () => {
  const result = await db.execute("SELECT * FROM settings");
  const settings = {};
  result.rows.forEach((row) => {
    settings[row.key] = parseSettingValue(row.value);
  });
  return settings;
};

const updateSetting = async (key, value) => {
  const jsonValue = JSON.stringify({ value });
  await db.execute({
    sql: "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = ?",
    args: [key, jsonValue, jsonValue],
  });
  return getSetting(key);
};

const updateSettings = async (payload = {}) => {
  const entries = Object.entries(payload || {});
  if (!entries.length) {
    return getSettings();
  }

  const statements = entries.map(([key, value]) => {
    const jsonValue = JSON.stringify({ value });
    return {
      sql: "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = ?",
      args: [key, jsonValue, jsonValue],
    };
  });

  await db.batch(statements, "write");
  return getSettings();
};

// --- Prompt variants ---

const getPromptVariant = async (type, variant) => {
  const result = await db.execute({
    sql: "SELECT * FROM prompt_variants WHERE type = ? AND variant = ?",
    args: [type, variant],
  });
  return mapPromptRow(result.rows[0]);
};

const getPromptVariants = async () => {
  const result = await db.execute("SELECT * FROM prompt_variants ORDER BY type, variant");
  return result.rows.map(mapPromptRow);
};

const upsertPromptVariant = async (type, variant, prompt) => {
  const timestamp = new Date().toISOString();
  await db.execute({
    sql: `
      INSERT INTO prompt_variants (type, variant, prompt, updatedAt)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(type, variant) DO UPDATE SET
        prompt = excluded.prompt,
        updatedAt = excluded.updatedAt
    `,
    args: [type, variant, prompt, timestamp],
  });
  return getPromptVariant(type, variant);
};

const deletePromptVariant = async (type, variant) => {
  const result = await db.execute({
    sql: "DELETE FROM prompt_variants WHERE type = ? AND variant = ?",
    args: [type, variant],
  });
  return result.rowsAffected > 0;
};

// --- Structured templates ---

const getStructuredTemplate = async (variant) => {
  const result = await db.execute({
    sql: "SELECT * FROM structured_templates WHERE variant = ?",
    args: [variant],
  });
  return mapTemplateRow(result.rows[0]);
};

const getStructuredTemplates = async () => {
  const result = await db.execute("SELECT * FROM structured_templates ORDER BY variant");
  return result.rows.map(mapTemplateRow);
};

const upsertStructuredTemplate = async (variant, prompt) => {
  const timestamp = new Date().toISOString();
  await db.execute({
    sql: `
      INSERT INTO structured_templates (variant, prompt, updatedAt)
      VALUES (?, ?, ?)
      ON CONFLICT(variant) DO UPDATE SET
        prompt = excluded.prompt,
        updatedAt = excluded.updatedAt
    `,
    args: [variant, prompt, timestamp],
  });
  return getStructuredTemplate(variant);
};

module.exports = {
  getSetting,
  getSettings,
  updateSetting,
  updateSettings,
  getPromptVariant,
  getPromptVariants,
  upsertPromptVariant,
  deletePromptVariant,
  getStructuredTemplate,
  getStructuredTemplates,
  upsertStructuredTemplate,
};
