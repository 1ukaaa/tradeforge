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
app.use(express.json());

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

const promptBuilders = {
  "analysis.v1": (rawText) => `
Tu es un assistant de journal de trading, expert des marchés dérivés.
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
${rawText}
  `,
  "trade.v1": (rawText, plan = "") => `
Tu es un assistant de journal de trading, expert des marchés dérivés.
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
${plan || "Plan manquant — indique pourquoi l’absence de plan a impacté la lecture du trade."}

Mission :
- Commente si l'exécution rapportée suit ou dévie du plan ; détaille les écarts (TA, gestion du risque, niveaux, timing).
- Indique la qualité de la décision finale (bonne décision, ajustement nécessaire, erreur) en lien avec ce plan.
 
CONTENU SOURCE :
${rawText}
  `,
};

app.post('/api/gemini', async (req, res) => {
  const { rawText, template = "analysis.v1", plan } = req.body;
  if (!rawText || typeof rawText !== "string") {
    return res.status(400).json({ result: "Texte d'analyse manquant." });
  }
  try {
    const promptBuilder = promptBuilders[template] || ((text) => text);
    const prompt = promptBuilder(rawText, plan);

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
