require("dotenv").config();
const axios = require("axios");
const path = require("path");
const Database = require("better-sqlite3");

const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.get('/', (req, res) => {
  res.send('Backend OK - Journal Trading IA');
});
app.use(express.json({ limit: '15mb' }));

const DB_PATH = path.resolve(__dirname, "journal.db");
const db = new Database(DB_PATH);

const serializeMetadata = (metadata) => {
  try {
    return JSON.stringify(metadata || {});
  } catch {
    return "{}";
  }
};

const parseMetadata = (value) => {
  try {
    return value ? JSON.parse(value) : {};
  } catch {
    return {};
  }
};

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

const DEFAULT_PLAN = {
  windows: ["Europe", "US"],
  style: "swing",
  pairs: "EURUSD, NAS100, DAX",
  tradeDuringNews: false,
  entryStrategy:
    "Attendre un retracement M15 confirmé par un support Daily, valider par impulsion H1 avant l’entrée.",
  risk: "1,5 % maximum par trade, stop sous le dernier swing, TP1 à +0,5 % / TP2 à +1,2 %.",
  management:
    "Sorties progressives : basculer en BE dès +0,2 %, verrouiller une portion à TP1 puis laisser courir.",
  notes: "Pas de position pendant annonces majeures, vérifier les niveaux macro avant toute prise.",
};

const journalSeed = [
  {
    type: "trade",
    content:
      "TYPE : Trade\n🎯 Objectif : 19320 → TP 1, TP 2 à 19415.\nConclusion : TP final, plan maintenu.",
    plan: "Entrée long sur cassure H1 / Stop sous support 19240.",
    transcript: "Breakout long sur NAS100 validé par impulsion H1.",
    metadata: {
      title: "Breakout long sur NAS100 après pression macro",
      symbol: "NAS100 / US30",
      date: "12 fév 2025 · 14:20",
      timeframe: "H1 / H4",
      result: "TP",
      grade: "+1,3%",
      planSummary: "Entrée sur retracement M15 validé + momentum H1.",
      outcome: "Parcours conforme à l’hypothèse, TP2 atteint.",
      planAdherence: 92,
      tags: ["Momentum", "Breakout", "Niveau clé"],
      nextSteps: "Réviser la zone S pour préparer la prochaine entrée.",
      risk: "Surveillance de la divergence RSI H1.",
    },
  },
  {
    type: "analyse",
    content:
      "TYPE : Analyse\nScénario long si Weekly casse 1.0900, scénario short si reprise sous 1.0840.\nPas de prise de position immédiate, suivre le momentum.",
    plan: "Priorité long > 1.0900 sinon attendre pullback S1 + confirmation H4.",
    transcript: "Analyse EUR/USD pré-NFP.",
    metadata: {
      title: "Deux scénarios sur EUR/USD avant NFP",
      symbol: "EURUSD",
      date: "11 fév 2025 · 20:10",
      timeframe: "Daily / H4",
      result: "Analyse",
      grade: "Scénarios croisés",
      planSummary: "Long au-dessus de Weekly 1.0900, sinon long au pullback S1.",
      outcome: "Deux chemins, la patience reste la règle.",
      planAdherence: 0,
      tags: ["Macro", "News", "Multi-thème"],
      nextSteps: "Garder le flux de liquidité avant décision.",
      risk: "Breakdown sous 1.0800 invalide bullish.",
    },
  },
  {
    type: "trade",
    content:
      "TYPE : Trade\nObjectif SL 86.10, TP à 84.95.\nSL déclenché après forced liquidity, ajuster la lecture.",
    plan: "Short UKOIL après rejet 88, SL sous 86.20.",
    transcript: "Short pétrole après inventaires.",
    metadata: {
      title: "Short CTA sur pétrole après décalage inventaires",
      symbol: "UKOIL",
      date: "08 fév 2025 · 09:35",
      timeframe: "H4 / Daily",
      result: "SL",
      grade: "-0,8% + apprentissage",
      planSummary: "Short continuation, stop sous 86.20.",
      outcome: "SL mais plan solide, ajuster flux.",
      planAdherence: 78,
      tags: ["Macro event", "Volatilité"],
      nextSteps: "Réévaluer la cause du rejet puis la suite.",
      risk: "Reprise possible si 89 cassé.",
    },
  },
];

const seedJournalEntries = () => {
  journalSeed.forEach((entry) => insertJournalEntry(entry));
};

const initJournal = () => {
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

  const { count } = db.prepare("SELECT COUNT(*) as count FROM entries").get();
  if (!count) {
    seedJournalEntries();
  }
};

const getJournalEntries = () => {
  const rows = db.prepare("SELECT * FROM entries ORDER BY createdAt DESC").all();
  return rows.map((row) => ({
    ...row,
    metadata: parseMetadata(row.metadata),
  }));
};

initJournal();

const DEFAULT_STRUCTURED_VARIANT = "detailed";

const initPlanConfig = () => {
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
    stmt.run(serializePlan(DEFAULT_PLAN), timestamp);
  }
};

const initStructuredTemplates = () => {
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
};

const initPromptVariants = () => {
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
};

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

const initSettingsTable = () => {
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
};

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

const DEFAULT_STRUCTURE_TEMPLATES = {
  detailed: `Tu es un assistant de trading responsable de remplir un journal de suivi (mode {{variantTitle}}).
{{instruction}}
Analyse le contenu fourni et retourne STRICTEMENT un objet JSON valide avec cette structure :
{
  "entryType": "{{entryType}}",
  "metadata": {
    "title": "...",
    "planSummary": "...",
    "result": "...",
    "grade": "...",
    "planAdherence": 0-100,
    "tags": ["...", "..."],
    "outcome": "...",
    "timeframe": "...",
    "symbol": "...",
    "nextSteps": "...",
    "risk": "..."
  },
  "content": "Résumé synthétique (optionnel)"
}
Fournis des textes courts sans décor Markdown.
CONTENU SOURCE :
{{rawText}}
PLAN :
{{plan}}
`,
  summary: `Tu es un assistant de trading responsable de remplir un journal de suivi (mode {{variantTitle}}).
{{instruction}}
Retourne un objet JSON valide avec la structure suivante, en utilisant des phrases très courtes et sans décor Markdown.
{
  "entryType": "{{entryType}}",
  "metadata": {
    "title": "...",
    "planSummary": "...",
    "result": "...",
    "grade": "...",
    "planAdherence": 0-100,
    "tags": ["...", "..."],
    "outcome": "...",
    "timeframe": "...",
    "symbol": "...",
    "nextSteps": "...",
    "risk": "..."
  },
  "content": "Résumé synthétique (optionnel)"
}
Sois synthétique (<=100 caractères par champ).
CONTENU SOURCE :
{{rawText}}
PLAN :
{{plan}}
`,
};

const DEFAULT_PROMPT_VARIANTS = {
  analysis: {
    default: `Tu es un assistant de journal de trading, expert des marchés dérivés.
Analyse le contenu fourni et restitue un rapport ultra synthétique en français en respectant STRICTEMENT ce format markdown :

TYPE : Analyse

1. 🔭 Contexte multi-timeframes (Monthly / Weekly / Daily)
2. 🧭 Zones clés & stratégie (Daily)
3. ⏱️ Structure intraday (H4 / H1 / M15)
4. 🎯 Scénarios proposés — présente au moins deux options et précise le niveau d'invalidation pour chaque
5. ⚠️ Risques & invalidations
6. ✅ Next steps / synthèse finale

Règles :
- Style professionnel, phrases courtes, aucune redite, tu ne prends pas de position définitive.
- Utilise des listes à puces pour les niveaux, arguments et scénarios.
- Termine par une synthèse chiffrée si des niveaux sont mentionnés.

CONTENU SOURCE :
{{rawText}}
`,
  },
  trade: {
    default: `Tu es un assistant de journal de trading, expert des marchés dérivés.
Analyse le contenu fourni comme un trade exécuté (ou validé) et restitue un rapport ultra synthétique en français en respectant STRICTEMENT ce format markdown :

TYPE : Trade

1. 🔭 Contexte multi-timeframes (Monthly / Weekly / Daily)
2. 🧭 Zones clés & stratégie (Daily et intraday)
3. ⏱️ Structure intraday (H4 / H1 / M15) et ordre exécuté
4. 🎯 Objectifs & déroulé — mention des niveaux visés (TP, SL) et du dénouement
5. 📍 Résultat final — indique TP, SL ou en cours + ton jugement (bonne décision, ajustement à faire, erreur)
6. ⚓ Relecture du trade — si TP, explique ce qui a marché ; si SL, argumente sur la qualité de la décision malgré la perte
7. ⚠️ Risques & invalidations (ce qui aurait pu casser le plan)
8. ✅ Enseignements / verdict synthétique chiffré

Règles :
- Style direct, phrases très courtes, pas de redite.
- Mentionne explicitement si le trade a TP ou SL puis analyse si c'était une erreur ou un bon trade malgré tout.
- Utilise des listes à puces pour chaque section.

Plan de trading fourni :
{{plan || "Plan manquant — indique pourquoi l’absence de plan a impacté la lecture du trade."}}

Mission :
- Commente si l'exécution rapportée suit ou dévie du plan ; détaille les écarts (TA, gestion du risque, niveaux, timing).
- Indique la qualité de la décision finale (bonne décision, ajustement nécessaire, erreur) en lien avec ce plan.

CONTENU SOURCE :
{{rawText}}
`,
  },
};

const getPlanConfig = () => {
  const row = db.prepare("SELECT data, updatedAt FROM plans WHERE id = 1").get();
  if (!row) return null;
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

initPlanConfig();
initSettingsTable();
initStructuredTemplates();
initPromptVariants();

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

const STRUCTURED_VARIANT_INSTRUCTIONS = {
  detailed: {
    title: "version détaillée",
    instruction:
      "Fournis une réponse complète avec contexte multi-timeframes, niveaux, résultats, enseignements et risques, ne laisse aucun champ vide.",
  },
  summary: {
    title: "version synthétique",
    instruction:
      "Reste très bref (<=100 caractères par champ), priorise les actions immédiates et résume chaque section en une ou deux phrases.",
  },
};

const formatTemplate = (template = "", data = {}) =>
  template.replace(/\{\{(\w+)\}\}/g, (_, key) => data[key] ?? "");

const getActiveVariant = (type, overrideVariant) =>
  overrideVariant ||
  getSetting(`${type}_variant`)?.value ||
  "default";

const buildPrompt = (type, rawText, plan = "", overrideVariant = null) => {
  const variant = getActiveVariant(type, overrideVariant);
  const storedTemplate =
    getPromptVariant(type, variant)?.prompt ||
    DEFAULT_PROMPT_VARIANTS[type]?.[variant] ||
    DEFAULT_PROMPT_VARIANTS[type]?.default ||
    "";
  return formatTemplate(storedTemplate, {
    rawText,
    plan,
    entryType: type === "trade" ? "trade" : "analyse",
  });
};

const buildStructuredPrompt = (rawText, entryType = "analyse", plan = "", variant = DEFAULT_STRUCTURED_VARIANT) => {
  const variantConfig =
    STRUCTURED_VARIANT_INSTRUCTIONS[variant] || STRUCTURED_VARIANT_INSTRUCTIONS[DEFAULT_STRUCTURED_VARIANT];
  const storedTemplate =
    getStructuredTemplate(variant)?.prompt ||
    DEFAULT_STRUCTURE_TEMPLATES[variant] ||
    DEFAULT_STRUCTURE_TEMPLATES[DEFAULT_STRUCTURED_VARIANT];
  return formatTemplate(storedTemplate, {
    variantTitle: variantConfig.title,
    instruction: variantConfig.instruction,
    entryType: entryType === "trade" ? "trade" : "analyse",
    plan,
    rawText,
  });
};

const extractJsonObject = (text = "") => {
  const start = text.indexOf("{");
  if (start === -1) return null;
  let depth = 0;
  for (let i = start; i < text.length; i++) {
    const char = text[i];
    if (char === "{") depth++;
    if (char === "}") depth--;
    if (depth === 0) {
      const candidate = text.slice(start, i + 1);
      try {
        return JSON.parse(candidate);
      } catch {
        continue;
      }
    }
  }
  return null;
};

app.post('/api/gemini', async (req, res) => {
  const { rawText, template = "analysis.v1", plan, variant } = req.body;
  if (!rawText || typeof rawText !== "string") {
    return res.status(400).json({ result: "Texte d'analyse manquant." });
  }
  try {
    const type = template.startsWith("trade") ? "trade" : "analysis";
    const activePlan = typeof plan === "string" ? plan : "";
    const prompt = buildPrompt(type, rawText, activePlan, variant);

    const response = await axios.post(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + process.env.GEMINI_API_KEY,
      {
        contents: [{ parts: [{ text: prompt }] }]
      }
    );

    const result =
      response.data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Aucune réponse valide de Gemini.";
    res.json({ result });
  } catch (err) {
    console.error("Erreur Gemini :", err?.response?.data || err.message);
    res.status(500).json({ result: "Erreur réelle Gemini API." });
  }
});

app.post('/api/gemini/structured', async (req, res) => {
  const { rawText, entryType = "analyse", plan, variant } = req.body;
  if (!rawText || typeof rawText !== "string") {
    return res.status(400).json({ error: "Texte structuré manquant." });
  }
  try {
    const configuredVariant =
      variant ||
      getSetting("structured_variant")?.value ||
      DEFAULT_STRUCTURED_VARIANT;
    const prompt = buildStructuredPrompt(rawText, entryType, plan, configuredVariant);

    // --- MODIFICATION ICI ---
    // 1. On crée un payload complet pour l'API Gemini
    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        // 2. On force l'API à répondre en JSON.
        // Fini le parsing fragile, Gemini garantit un JSON valide.
        response_mime_type: "application/json",
      },
    };

    const response = await axios.post(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + process.env.GEMINI_API_KEY,
      payload // 3. On envoie le nouveau payload
    );

    // 4. La réponse TEXTE est maintenant le JSON lui-même, sans "Voici le JSON..."
    const resultText =
      response.data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      null;

    if (!resultText) {
      throw new Error("Aucune réponse complète de Gemini.");
    }

    // 5. On peut parser directement. Plus besoin de 'extractJsonObject'.
    const parsed = JSON.parse(resultText);
    
    // 6. On renvoie l'objet structuré que le frontend attend.
    res.json({ structured: parsed });
    // --- FIN DE LA MODIFICATION ---

  } catch (err) {
    console.error("Erreur Gemini structuré :", err?.response?.data || err.message);
    // On renvoie un message d'erreur plus clair au frontend
    const apiError = err?.response?.data?.error?.message || err.message;
    res.status(500).json({ error: `Erreur Gemini structurée: ${apiError}` });
  }
});

app.get('/api/plan', (req, res) => {
  const config = getPlanConfig();
  res.json({
    plan: config?.plan || DEFAULT_PLAN,
    updatedAt: config?.updatedAt || new Date().toISOString(),
  });
});

app.put('/api/plan', (req, res) => {
  const { plan } = req.body;
  if (!plan || typeof plan !== "object") {
    return res.status(400).json({ error: "Plan manquant." });
  }
  try {
    const saved = upsertPlanConfig(plan);
    res.json(saved);
  } catch (err) {
    console.error("Erreur plan :", err);
    res.status(500).json({ error: "Impossible d'enregistrer le plan." });
  }
});

app.get('/api/settings', (req, res) => {
  const structuredVariant = getSetting("structured_variant")?.value || DEFAULT_STRUCTURED_VARIANT;
  const analysisVariant = getSetting("analysis_variant")?.value || "default";
  const tradeVariant = getSetting("trade_variant")?.value || "default";
  res.json({ structuredVariant, analysisVariant, tradeVariant });
});

app.put('/api/settings', (req, res) => {
  const { structuredVariant, analysisVariant, tradeVariant } = req.body;
  const currentStructured = getSetting("structured_variant")?.value || DEFAULT_STRUCTURED_VARIANT;
  const currentAnalysis = getSetting("analysis_variant")?.value || "default";
  const currentTrade = getSetting("trade_variant")?.value || "default";
  const updates = {};
  if (structuredVariant) updates.structuredVariant = structuredVariant;
  if (analysisVariant) updates.analysisVariant = analysisVariant;
  if (tradeVariant) updates.tradeVariant = tradeVariant;
  if (!Object.keys(updates).length) {
    return res.status(400).json({ error: "Aucun champ à mettre à jour." });
  }
  try {
    if (updates.structuredVariant) {
      upsertSetting("structured_variant", updates.structuredVariant);
    }
    if (updates.analysisVariant) {
      upsertSetting("analysis_variant", updates.analysisVariant);
    }
    if (updates.tradeVariant) {
      upsertSetting("trade_variant", updates.tradeVariant);
    }
    res.json({
      structuredVariant: updates.structuredVariant || currentStructured,
      analysisVariant: updates.analysisVariant || currentAnalysis,
      tradeVariant: updates.tradeVariant || currentTrade,
    });
  } catch (err) {
    console.error("Erreur settings :", err);
    res.status(500).json({ error: "Impossible de mettre à jour les paramètres." });
  }
});

app.get('/api/prompt-variants', (req, res) => {
  const variants = getPromptVariants();
  res.json({ variants });
});

app.put('/api/prompt-variants', (req, res) => {
  const { type, variant, prompt } = req.body;
  if (!type || !variant || !prompt) {
    return res.status(400).json({ error: "Type, variant ou prompt manquant." });
  }
  try {
    const updated = upsertPromptVariant(type, variant, prompt);
    res.json({ variant: updated });
  } catch (err) {
    console.error("Erreur prompt variant :", err);
    res.status(500).json({ error: "Impossible de mettre à jour le template." });
  }
});

app.delete('/api/prompt-variants', (req, res) => {
  const { type, variant } = req.body;
  if (!type || !variant) {
    return res.status(400).json({ error: "Type ou variant manquant." });
  }
  if (variant === "default") {
    return res.status(400).json({ error: "La variante ‘default’ est système et ne peut pas être supprimée." });
  }
  try {
    const deleted = deletePromptVariant(type, variant);
    if (!deleted) {
      return res.status(404).json({ error: "Variante introuvable." });
    }
    res.json({ success: true });
  } catch (err) {
    console.error("Erreur suppression variante :", err);
    res.status(500).json({ error: "Impossible de supprimer la variante." });
  }
});

app.get('/api/structured-templates', (req, res) => {
  const variants = Object.keys(DEFAULT_STRUCTURE_TEMPLATES);
  const templates = variants.map((variant) => {
    const stored = getStructuredTemplate(variant);
    return {
      variant,
      prompt: stored?.prompt || DEFAULT_STRUCTURE_TEMPLATES[variant],
      updatedAt: stored?.updatedAt || new Date().toISOString(),
    };
  });
  res.json({ templates });
});

app.put('/api/structured-templates', (req, res) => {
  const { variant, prompt } = req.body;
  if (!variant || !prompt) {
    return res.status(400).json({ error: "Variant ou prompt manquant." });
  }
  try {
    const updated = upsertStructuredTemplate(variant, prompt);
    res.json({ structuredTemplate: updated });
  } catch (err) {
    console.error("Erreur template :", err);
    res.status(500).json({ error: "Impossible d’enregistrer le template." });
  }
});

app.get('/api/journal', (req, res) => {
  const entries = getJournalEntries();
  res.json({ entries });
});

app.post('/api/journal', (req, res) => {
  const { type, content, plan, transcript, metadata } = req.body;
  if (!content || typeof content !== "string") {
    return res.status(400).json({ error: "Contenu de l'entrée manquant." });
  }

  const normalizedType = type === "trade" ? "trade" : "analyse";

  try {
    const entry = insertJournalEntry({
      type: normalizedType,
      content,
      plan,
      transcript,
      metadata,
    });
    res.json({ entry });
  } catch (err) {
    console.error("Erreur journal :", err);
    res.status(500).json({ error: "Impossible d'enregistrer l'entrée." });
  }
});

app.put('/api/journal/:id', (req, res) => {
  const { id } = req.params;
  const { type, content, plan, transcript, metadata } = req.body;
  if (!content || typeof content !== "string") {
    return res.status(400).json({ error: "Contenu de l'entrée manquant." });
  }
  if (!id) {
    return res.status(400).json({ error: "Identifiant manquant." });
  }

  const normalizedType = type === "trade" ? "trade" : "analyse";

  const updated = updateJournalEntry({
    id: Number(id),
    type: normalizedType,
    content,
    plan,
    transcript,
    metadata,
  });
  if (!updated) {
    return res.status(404).json({ error: "Entrée introuvable." });
  }
  res.json({ entry: updated });
});

app.delete('/api/journal/:id', (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ error: "Identifiant manquant." });
  }
  const deleted = deleteJournalEntry(Number(id));
  if (!deleted) {
    return res.status(404).json({ error: "Entrée introuvable." });
  }
  res.status(204).end();
});

app.listen(5050, () => {
  console.log('Server started on port 5050');
});
