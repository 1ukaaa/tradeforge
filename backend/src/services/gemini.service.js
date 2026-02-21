// backend/src/services/gemini.service.js
const axios = require("axios");
const { enforceRateLimit } = require("../core/rateLimiter");
const { getPromptVariant, getStructuredTemplate, getSetting } = require("./settings.service");
const {
  DEFAULT_STRUCTURED_VARIANT,
  STRUCTURED_VARIANT_INSTRUCTIONS,
  DEFAULT_STRUCTURE_TEMPLATES,
  DEFAULT_PROMPT_VARIANTS
} = require("../config/prompts");

const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";
const DEFAULT_TEXT_MODEL = process.env.GEMINI_TEXT_MODEL || "gemini-2.5-flash";
const DEFAULT_IMAGE_MODEL =
  process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";
const GEMINI_LIMITS = {
  RPM: 10, // requêtes/min
  RPD: 250, // requêtes/jour
  TPM: 250_000, // tokens/min (approx)
};

const buildGeminiUrl = (model, method = "generateContent") =>
  `${GEMINI_BASE_URL}/${model}:${method}?key=${process.env.GEMINI_API_KEY}`;

// --- Utils ---

const formatTemplate = (template = "", data = {}) =>
  template.replace(/\{\{(\w+)\}\}/g, (_, key) => data[key] ?? "");

const getActiveVariant = async (type, overrideVariant) => {
  if (overrideVariant) return overrideVariant;
  const setting = await getSetting(`${type}_variant`);
  return setting?.value || "default";
};

const resolvePromptTemplate = async (type, variant) => {
  const stored = (await getPromptVariant(type, variant))?.prompt;
  if (stored && stored.trim()) {
    return stored;
  }
  const fallback =
    DEFAULT_PROMPT_VARIANTS[type]?.[variant] ||
    DEFAULT_PROMPT_VARIANTS[type]?.default ||
    DEFAULT_PROMPT_VARIANTS.analysis?.default ||
    "";

  if (fallback && fallback.trim()) {
    return fallback;
  }

  throw new Error(`Aucun template configuré pour le type "${type}" et la variante "${variant || "default"}".`);
};

const estimateTokens = (payload = {}) => {
  // Approximation: ~4 caractères par token
  const text = JSON.stringify(payload || {});
  return Math.ceil(text.length / 4);
};

// --- Prompt Builders ---

const buildPrompt = async (type, rawText, plan = "", overrideVariant = null) => {
  const variant = await getActiveVariant(type, overrideVariant);
  const storedTemplate = await resolvePromptTemplate(type, variant);
  return formatTemplate(storedTemplate, {
    rawText,
    plan,
    entryType: type === "trade" ? "trade" : "analyse",
    date: new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }),
  });
};

const buildStructuredPrompt = async (
  rawText,
  entryType = "analyse",
  plan = "",
  variant = DEFAULT_STRUCTURED_VARIANT
) => {
  const variantConfig =
    STRUCTURED_VARIANT_INSTRUCTIONS[variant] || STRUCTURED_VARIANT_INSTRUCTIONS[DEFAULT_STRUCTURED_VARIANT];
  const storedTemplate =
    (await getStructuredTemplate(variant))?.prompt ||
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

// --- API Call Logic ---

const callGeminiAPI = async (payload) => {
  // Limites: requêtes/minute, requêtes/jour et tokens/minute
  enforceRateLimit("gemini:rpm", {
    windowMs: 60 * 1000,
    max: GEMINI_LIMITS.RPM,
    message: "Limite Gemini atteinte : 10 requêtes par minute.",
  });
  enforceRateLimit("gemini:rpd", {
    windowMs: 24 * 60 * 60 * 1000,
    max: GEMINI_LIMITS.RPD,
    message: "Limite Gemini atteinte : 250 requêtes par jour.",
  });
  const tokens = estimateTokens(payload);
  enforceRateLimit("gemini:tpm", {
    windowMs: 60 * 1000,
    max: GEMINI_LIMITS.TPM,
    weight: tokens,
    message: "Limite Gemini atteinte : 250k tokens par minute.",
  });
  try {
    const response = await axios.post(buildGeminiUrl(DEFAULT_TEXT_MODEL), payload);

    const resultText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!resultText) {
      throw new Error("Aucune réponse complète de Gemini.");
    }
    return resultText;

  } catch (err) {
    console.error("Erreur Gemini :", err?.response?.data || err.message);
    const apiError = err?.response?.data?.error?.message || err.message;
    throw new Error(`Erreur API Gemini: ${apiError}`);
  }
}

const callGeminiImageAPI = async (prompt) => {
  enforceRateLimit("gemini:rpm", {
    windowMs: 60 * 1000,
    max: GEMINI_LIMITS.RPM,
    message: "Limite Gemini atteinte : 10 requêtes par minute.",
  });
  enforceRateLimit("gemini:rpd", {
    windowMs: 24 * 60 * 60 * 1000,
    max: GEMINI_LIMITS.RPD,
    message: "Limite Gemini atteinte : 250 requêtes par jour.",
  });
  try {
    const payload = {
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        response_modalities: ["TEXT", "IMAGE"],
      },
    };
    const response = await axios.post(buildGeminiUrl(DEFAULT_IMAGE_MODEL), payload);
    const candidates = response.data?.candidates || [];
    const parts = candidates.flatMap((candidate) => candidate?.content?.parts || []);
    const imagePart = parts.find((part) => part?.inline_data?.data || part?.inlineData?.data);
    const inlineData = imagePart?.inline_data || imagePart?.inlineData;
    if (!inlineData?.data) {
      throw new Error("Aucune image renvoyée par Gemini.");
    }
    return {
      image: inlineData.data,
      mimeType: inlineData.mime_type || inlineData.mimeType || "image/png",
    };
  } catch (err) {
    console.error("Erreur Gemini (image) :", err?.response?.data || err.message);
    const apiError = err?.response?.data?.error?.message || err.message;
    throw new Error(`Erreur API Gemini: ${apiError}`);
  }
};

/**
 * Génère l'analyse texte (Markdown).
 */
const inferPromptType = (type, template = "") => {
  if (type) return type;
  if (typeof template === "string") {
    if (template.startsWith("trade")) return "trade";
    if (template.startsWith("twitter")) return "twitter";
  }
  return "analysis";
};

const generateAnalysis = async ({ rawText, template = "", plan, variant, type }) => {
  if (!rawText || typeof rawText !== "string") {
    throw new Error("Texte d'analyse manquant.");
  }

  const promptType = inferPromptType(type, template);
  const activePlan = typeof plan === "string" ? plan : "";
  const prompt = await buildPrompt(promptType, rawText, activePlan, variant);

  const payload = {
    contents: [{ parts: [{ text: prompt }] }]
  };

  const result = await callGeminiAPI(payload);
  return { result };
};

/**
 * Génère l'analyse structurée (JSON).
 */
const generateStructuredAnalysis = async ({ rawText, entryType, plan, variant }) => {
  if (!rawText || typeof rawText !== "string") {
    throw new Error("Texte structuré manquant.");
  }

  const configuredVariant =
    variant ||
    (await getSetting("structured_variant"))?.value ||
    DEFAULT_STRUCTURED_VARIANT;

  const prompt = await buildStructuredPrompt(rawText, entryType, plan, configuredVariant);

  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      response_mime_type: "application/json",
    },
  };

  const resultText = await callGeminiAPI(payload);
  let parsed;
  try {
    parsed = JSON.parse(resultText);
  } catch {
    throw new Error("Réponse Gemini invalide (JSON non parsable).");
  }
  if (!parsed || typeof parsed !== "object") {
    throw new Error("Réponse Gemini invalide (format JSON).");
  }
  if (!parsed.metadata || typeof parsed.metadata !== "object") {
    throw new Error("Réponse Gemini invalide (champ metadata manquant).");
  }
  return { structured: parsed };
};

const generateImage = async ({ prompt }) => {
  if (!prompt || typeof prompt !== "string") {
    throw new Error("Description d'image manquante.");
  }

  const cleanPrompt = prompt.trim();
  if (!cleanPrompt) {
    throw new Error("Description d'image manquante.");
  }

  const imageData = await callGeminiImageAPI(cleanPrompt);
  return {
    image: imageData.image,
    mimeType: imageData.mimeType || "image/png",
  };
};

const generateChatAnalysis = async ({ rawText, plan, recentTrades }) => {
  if (!rawText || typeof rawText !== "string") {
    throw new Error("Texte manquant.");
  }

  const tradesStr = recentTrades && Array.isArray(recentTrades)
    ? JSON.stringify(recentTrades.map(t => ({
      date: t.date, asset: t.asset, direction: t.direction, result: t.result, account: t.account, setup: t.setup
    }))).substring(0, 100000)
    : "[]";

  const prompt = `Tu es TradeForge AI, l'assistant expert en analyse quantitative de trading de Luka.
Ton objectif est de répondre aux questions de l'utilisateur sur ses performances de trading, son plan et son journal.

### PLAN DE TRADING (contexte, ne limite PAS l'analyse aux instruments du plan):
${plan || 'Aucun'}

### DONNÉES DE TRADING (deux sources fusionnées):
Les trades ci-dessous proviennent de deux sources:
- source "broker": trades réels importés depuis le courtier/CSV (contiennent le champ "pnl" en valeur monétaire, "result" = "win" si pnl >= 0 sinon "loss")
- source "journal": entrées manuelles du journal (contiennent le champ "result" comme texte libre ex: "win", "loss", "be")

IMPORTANT: Analysez TOUS les actifs présents dans ces données, y compris CL (pétrole), même s'ils ne figurent pas dans le plan de trading.
Le champ "asset" ou "symbol" contient le ticker (ex: "CL" pour le pétrole brut, "EURUSD", "NAS100", etc.)
Le champ "direction" peut être "LONG", "SHORT", "BUY", "SELL", "CLOSE LONG", "CLOSE SHORT".

${tradesStr}

### QUESTION DE L'UTILISATEUR:
${rawText}

Réponds avec une analyse claire, chiffrée (si pertinent) et concise. Base-toi UNIQUEMENT sur les données fournies ci-dessus. N'invente jamais de données absentes. Sois précis et aide Luka à s'améliorer. Structure ta réponse avec du Markdown (gras, puces, tableaux si utile).
`;

  const payload = {
    contents: [{ parts: [{ text: prompt }] }]
  };

  const result = await callGeminiAPI(payload);
  return { result };
};

module.exports = {
  generateAnalysis,
  generateStructuredAnalysis,
  generateImage,
  generateChatAnalysis,
};
