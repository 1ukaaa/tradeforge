// backend/src/services/settings.service.js
const db = require("../core/database");
const { DEFAULT_STRUCTURED_VARIANT } = require("../config/prompts");

// --- Prompt Variants (Analyse / Trade) ---

const getPromptVariant = (type, variant) => {
  const row = db
    .prepare("SELECT prompt, updatedAt FROM prompt_variants WHERE type = ? AND variant = ?")
    .get(type, variant);
  if (!row) return null;
  return {
    prompt: row.prompt,
    updatedAt: row.updatedAt,
  };
};

const upsertPromptVariant = (type, variant, prompt) => {
  const timestamp = new Date().toISOString();
  db.prepare(
    "INSERT INTO prompt_variants (type, variant, prompt, updatedAt) VALUES (?, ?, ?, ?) ON CONFLICT(type, variant) DO UPDATE SET prompt=excluded.prompt, updatedAt=excluded.updatedAt"
  ).run(type, variant, prompt, timestamp);
  return { type, variant, prompt, updatedAt: timestamp };
};

const deletePromptVariant = (type, variant) => {
  const stmt = db.prepare("DELETE FROM prompt_variants WHERE type = ? AND variant = ?");
  const info = stmt.run(type, variant);
  return info.changes > 0;
};

const getPromptVariants = () => {
  const rows = db.prepare("SELECT type, variant, prompt, updatedAt FROM prompt_variants").all();
  return rows.reduce((acc, row) => {
    acc[row.type] = acc[row.type] || [];
    acc[row.type].push(row);
    return acc;
  }, {});
};

// --- Structured Templates (JSON) ---

const getStructuredTemplate = (variant) => {
  const row = db
    .prepare("SELECT prompt, updatedAt FROM structured_templates WHERE variant = ?")
    .get(variant);
  if (!row) return null;
  return {
    prompt: row.prompt,
    updatedAt: row.updatedAt,
  };
};

const upsertStructuredTemplate = (variant, prompt) => {
  const timestamp = new Date().toISOString();
  db.prepare(
    "INSERT INTO structured_templates (variant, prompt, updatedAt) VALUES (?, ?, ?) ON CONFLICT(variant) DO UPDATE SET prompt=excluded.prompt, updatedAt=excluded.updatedAt"
  ).run(variant, prompt, timestamp);
  return { variant, prompt, updatedAt: timestamp };
};

const getStructuredTemplates = () => {
  // Note: On importe les clés par défaut au cas où la BDD est vide
  const { DEFAULT_STRUCTURE_TEMPLATES } = require("../config/prompts");
  const variants = Object.keys(DEFAULT_STRUCTURE_TEMPLATES);
  
  const templates = variants.map((variant) => {
    const stored = getStructuredTemplate(variant);
    return {
      variant,
      prompt: stored?.prompt || DEFAULT_STRUCTURE_TEMPLATES[variant], // Fallback
      updatedAt: stored?.updatedAt || new Date().toISOString(),
    };
  });
  return templates;
};


// --- App Settings (Active Variants & Account) ---

const getSetting = (key) => {
  const row = db.prepare("SELECT value FROM settings WHERE key = ?").get(key);
  if (!row) return null;
  try {
    return JSON.parse(row.value);
  } catch {
    return null;
  }
};

const upsertSetting = (key, value) => {
  const serialized = JSON.stringify({ value });
  const stmt = db.prepare(
    "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value"
  );
  stmt.run(key, serialized);
};

const getSettings = () => {
  const structuredVariant = getSetting("structured_variant")?.value || DEFAULT_STRUCTURED_VARIANT;
  const analysisVariant = getSetting("analysis_variant")?.value || "default";
  const tradeVariant = getSetting("trade_variant")?.value || "default";
  
  // Champs pour le compte
  const accountName = getSetting("account_name")?.value || "Luka";
  const capitalForex = getSetting("capital_forex")?.value || 0;
  const capitalCrypto = getSetting("capital_crypto")?.value || 0;
  // REMPLACEMENT de accountCurrency par deux champs
  const capitalForexCurrency = getSetting("capital_forex_currency")?.value || "EUR"; // NOUVEAU
  const capitalCryptoCurrency = getSetting("capital_crypto_currency")?.value || "USD"; // NOUVEAU

  return { 
    structuredVariant, 
    analysisVariant, 
    tradeVariant,
    accountName,
    capitalForex,
    capitalCrypto,
    capitalForexCurrency,  // NOUVEAU
    capitalCryptoCurrency  // NOUVEAU
  };
};

const updateSettings = (updates) => {
  const current = getSettings();
  
  if (updates.structuredVariant) {
    upsertSetting("structured_variant", updates.structuredVariant);
    current.structuredVariant = updates.structuredVariant;
  }
  if (updates.analysisVariant) {
    upsertSetting("analysis_variant", updates.analysisVariant);
    current.analysisVariant = updates.analysisVariant;
  }
  if (updates.tradeVariant) {
    upsertSetting("trade_variant", updates.tradeVariant);
    current.tradeVariant = updates.tradeVariant;
  }

  // Champs pour le compte
  if (updates.accountName) {
    upsertSetting("account_name", updates.accountName);
    current.accountName = updates.accountName;
  }
  if (updates.capitalForex !== undefined) {
    upsertSetting("capital_forex", parseFloat(updates.capitalForex) || 0);
    current.capitalForex = parseFloat(updates.capitalForex) || 0;
  }
  if (updates.capitalCrypto !== undefined) {
    upsertSetting("capital_crypto", parseFloat(updates.capitalCrypto) || 0);
    current.capitalCrypto = parseFloat(updates.capitalCrypto) || 0;
  }
  
  // REMPLACEMENT de accountCurrency par deux champs
  if (updates.capitalForexCurrency) { // NOUVEAU
    upsertSetting("capital_forex_currency", updates.capitalForexCurrency);
    current.capitalForexCurrency = updates.capitalForexCurrency;
  }
  if (updates.capitalCryptoCurrency) { // NOUVEAU
    upsertSetting("capital_crypto_currency", updates.capitalCryptoCurrency);
    current.capitalCryptoCurrency = updates.capitalCryptoCurrency;
  }

  return current;
};

module.exports = {
  getPromptVariant,
  upsertPromptVariant,
  deletePromptVariant,
  getPromptVariants,
  getStructuredTemplate,
  upsertStructuredTemplate,
  getStructuredTemplates,
  getSetting,
  upsertSetting,
  getSettings,
  updateSettings,
};