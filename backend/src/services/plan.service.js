// backend/src/services/plan.service.js
const db = require("../core/database");
// MODIFICATION : Importer depuis le nouveau fichier de config
const { DEFAULT_PLAN } = require("../config/plan.config");

// --- Utils ---
const serializePlan = (plan) => {
  try {
    return JSON.stringify(plan || {});
  } catch {
    return "{}";
  }
};

const parsePlan = (value) => {
  try {
    return value ? JSON.parse(value) : {};
  } catch {
    return {};
  }
};

// --- Constantes ---
// MODIFICATION : La constante DEFAULT_PLAN a été supprimée d'ici.

// --- Service BDD ---

const getPlanConfig = () => {
  const row = db.prepare("SELECT data, updatedAt FROM plans WHERE id = 1").get();
  if (!row) {
    // Fallback au cas où la BDD serait vide après init
    return { plan: DEFAULT_PLAN, updatedAt: new Date().toISOString() };
  }
  return {
    plan: parsePlan(row.data),
    updatedAt: row.updatedAt,
  };
};

const upsertPlanConfig = (plan) => {
  const normalized = {
    ...DEFAULT_PLAN,
    ...plan,
    windows: Array.isArray(plan?.windows) ? plan.windows : DEFAULT_PLAN.windows,
    tradeDuringNews:
      typeof plan?.tradeDuringNews === "boolean" ? plan.tradeDuringNews : DEFAULT_PLAN.tradeDuringNews,
  };
  const timestamp = new Date().toISOString();
  const stmt = db.prepare(
    "INSERT INTO plans (id, data, updatedAt) VALUES (1, ?, ?) ON CONFLICT(id) DO UPDATE SET data=excluded.data, updatedAt=excluded.updatedAt"
  );
  stmt.run(serializePlan(normalized), timestamp);
  return { plan: normalized, updatedAt: timestamp };
};

module.exports = {
  // MODIFICATION : On n'exporte plus DEFAULT_PLAN d'ici
  getPlanConfig,
  upsertPlanConfig,
};