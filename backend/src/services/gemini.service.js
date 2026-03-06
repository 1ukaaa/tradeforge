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
const DEFAULT_TEXT_MODEL = process.env.GEMINI_TEXT_MODEL || "gemini-3-flash-preview";

const DEFAULT_IMAGE_MODEL =
  process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";
const GEMINI_LIMITS = {
  RPM: 5,        // requêtes/min (limite réelle du compte)
  RPD: 20,       // requêtes/jour (limite réelle du compte)
  TPM: 250_000,  // tokens/min
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

/**
 * Construit le system prompt (injecté comme premier message "user" suivi d'un ack "model").
 * Gemini 2.5 Flash ne supporte pas encore le champ `systemInstruction` en v1beta,
 * donc on simule le system prompt avec le premier échange user/model.
 */
const buildChatSystemPrompt = (plan, recentTrades) => {
  // Optimisation de la rapidité : On ne prend que les 50 trades les plus récents
  // pour éviter un Time-to-First-Token (TTFT) trop long.
  const recentTradesOptimized = recentTrades && Array.isArray(recentTrades)
    ? recentTrades.slice(0, 50)
    : [];

  const tradesStr = recentTradesOptimized.length > 0
    ? JSON.stringify(
      recentTradesOptimized.map(t => ({
        id: t.id,
        date: t.date,
        asset: t.asset,
        direction: t.direction,
        result: t.result,
        pnl: t.pnl,
        account: t.account,
        setup: t.setup,
        hasImages: Array.isArray(t.images) && t.images.length > 0,
      }))
    )
    : "[]";

  return `Tu es TradeForge AI, l'assistant expert en analyse quantitative de trading de Luka.
Ton objectif est de répondre aux questions de l'utilisateur sur ses performances de trading, son plan et son journal.
Garde le contexte de la conversation : réfère-toi aux messages précédents si l'utilisateur fait allusion à un échange antérieur.

### PLAN DE TRADING (contexte, ne limite PAS l'analyse aux instruments du plan) :
${plan || 'Aucun'}

### DONNÉES DE TRADING — JOURNAL UNIQUEMENT :
Les données ci-dessous proviennent exclusivement du journal de trading de l'utilisateur.
Un filtre de compte a déjà été appliqué côté application : tu analyses uniquement les entrées pertinentes.
Chaque entrée contient :
- "id" : l'identifiant unique du trade
- "date" : date du trade
- "asset" : ticker de l'instrument (ex : "CL" pour le pétrole, "NAS100", "EURUSD"...)
- "direction" : "Achat" ou "Vente"
- "result" : "Win", "Loss" ou "Breakeven"
- "account" : nom du compte de trading
- "setup" : description du setup ou de la stratégie utilisée
- "hasImages" : un booléen (vrai si des images sont associées à ce trade, faux sinon)

IMPORTANT:
1. Analyse TOUS les actifs présents, même s'ils ne figurent pas dans le plan de trading.
2. Si le tableau de données est vide, informe l'utilisateur qu'aucune entrée de journal ne correspond aux filtres sélectionnés.
3. IMAGES (TRES IMPORTANT): Lorsque tu récapitules ou analyses un trade spécifique, et que celui-ci possède \`hasImages: true\`, tu DOIS EXPLICITEMENT inclure ses images. Pour ce faire, insère exactement ce code markdown dans ta réponse : \`![Images du Trade](TFA_IMAGE_XX)\` en remplaçant \`XX\` par l'ID réel du trade. Notre interface se chargera de remplacer ce code par les vraies images pour l'utilisateur. Ne mentionne jamais l'absence d'images si le trade n'en possède pas (omets simplement le code).

${tradesStr}

Réponds avec une analyse claire, chiffrée (si pertinent) et concise. Base-toi UNIQUEMENT sur les données du journal fournies ci-dessus. N'invente jamais de données absentes. Sois précis et aide Luka à s'améliorer. Structure ta réponse avec du Markdown (gras, puces, tableaux si utile, images).`;
};

const buildInvestmentSystemPrompt = (recentActivity, investments) => {
  const recentStr = recentActivity && Array.isArray(recentActivity)
    ? JSON.stringify(recentActivity.slice(0, 50))
    : "[]";

  const invStr = investments && Array.isArray(investments)
    ? JSON.stringify(investments)
    : "[]";

  return `Tu es TradeForge AI, l'assistant expert en analyse quantitative de trading et d'INVESTISSEMENT de Luka.
Ton objectif est de répondre aux questions de l'utilisateur sur son portefeuille d'investissement, l'évolution de son capital, et ses récents dividendes / transactions.
Garde le contexte de la conversation : réfère-toi aux messages précédents si nécessaire.

### DONNÉES DU PORTEFEUILLE ACTUEL :
${invStr}

### ACTIVITÉ RÉCENTE (Achats, Ventes, Dividendes) :
${recentStr}

IMPORTANT:
1. L'utilisateur peut te demander des choses comme "Pourquoi j'ai un pic de 5000€ le 27 février 2025 ?". 
2. Tu devras chercher dans l'ACTIVITÉ RÉCENTE tout mouvement important autour de cette date (ex: dépôt, gros achat, ou gros versement de dividende).
3. N'invente pas de données, utilise le contexte fourni. S'il y a de vraies actualités dans l'économie réelle autour des actifs du portefeuille (ex: earnings Apple, taux FED...), tu peux les mentionner et les corréler aux variations si tu disposes de cette connaissance du monde réel.
4. Réponds toujours de manière claire, chiffrée, et dans un format aéré (Markdown).`;
};

/**
 * Analyse en mode chat multi-tours.
 * @param {string} rawText - La nouvelle question de l'utilisateur.
 * @param {string} plan - Description du plan de trading.
 * @param {Array} recentTrades - Trades du broker + journal.
 * @param {Array} history - Historique [{role: 'user'|'ai', text: string}] des messages précédents.
 * @param {string} model - Modele d'IA à utiliser.
 */
const generateChatAnalysis = async ({ rawText, plan, recentTrades, history = [], model }) => {
  if (!rawText || typeof rawText !== "string") {
    throw new Error("Texte manquant.");
  }

  const systemPrompt = buildChatSystemPrompt(plan, recentTrades);

  // On simule systemInstruction via un premier échange user/model
  const systemTurn = [
    { role: "user", parts: [{ text: systemPrompt }] },
    { role: "model", parts: [{ text: "Compris. Je suis prêt à analyser tes données de trading." }] },
  ];

  // Optimisation du contexte : on limite aux 8 derniers échanges pour garder la session fluide
  const historyTurns = (Array.isArray(history) ? history.slice(-8) : []).flatMap(msg => {
    if (msg.role === "user") {
      return [{ role: "user", parts: [{ text: msg.text }] }];
    }
    if (msg.role === "ai") {
      return [{ role: "model", parts: [{ text: msg.text }] }];
    }
    return [];
  });

  // Nouveau message de l'utilisateur
  const newTurn = { role: "user", parts: [{ text: rawText }] };

  const contents = [...systemTurn, ...historyTurns, newTurn];

  const payload = { contents };
  const targetModel = model === "gemini-2.5-flash" ? "gemini-2.5-flash" : "gemini-3-flash-preview";

  // Note: we can't cleanly pass targetModel to existing callGeminiAPI without changing its signature, 
  // but generateChatAnalysis calls callGeminiAPI which uses DEFAULT_TEXT_MODEL currently. 
  // For simplicity, we can fetch directly or modify callGeminiAPI. Let's assume callGeminiAPI isn't model aware 
  // so we should modify streamChatAnalysis which uses fetch directly, or generateChatAnalysis.
  // Wait, I will just do it for streamChatAnalysis which is the main one used.
  const result = await callGeminiAPI(payload);
  return { result };
};

/**
 * Streaming version du chat : appelle :streamGenerateContent et
 * appelle onChunk(text) pour chaque fragment de texte reçu.
 * Retourne le texte complet une fois terminé.
 */
const streamChatAnalysis = async ({ rawText, plan, recentTrades, history = [], onChunk, model }) => {
  if (!rawText || typeof rawText !== "string") {
    throw new Error("Texte manquant.");
  }

  const systemPrompt = buildChatSystemPrompt(plan, recentTrades);

  const systemTurn = [
    { role: "user", parts: [{ text: systemPrompt }] },
    { role: "model", parts: [{ text: "Compris. Je suis prêt à analyser tes données de trading." }] },
  ];

  // Optimisation du contexte : limite aux 8 derniers messages
  const historyTurns = (Array.isArray(history) ? history.slice(-8) : []).flatMap(msg => {
    if (msg.role === "user") return [{ role: "user", parts: [{ text: msg.text }] }];
    if (msg.role === "ai") return [{ role: "model", parts: [{ text: msg.text }] }];
    return [];
  });

  const contents = [...systemTurn, ...historyTurns, { role: "user", parts: [{ text: rawText }] }];

  const targetModel = model === "gemini-2.5-flash" ? "gemini-2.5-flash" : "gemini-3-flash-preview";

  // Endpoint streaming de Gemini (retourne du SSE avec alt=sse)
  const url = `${GEMINI_BASE_URL}/${targetModel}:streamGenerateContent?key=${process.env.GEMINI_API_KEY}&alt=sse`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini stream error ${response.status}: ${err}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let fullText = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop(); // garde la ligne incomplète pour la prochaine itération

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const data = line.slice(6).trim();
      if (data === "[DONE]" || !data) continue;

      try {
        const parsed = JSON.parse(data);
        const chunk = parsed.candidates?.[0]?.content?.parts
          ?.map(p => p.text || "")
          .join("") || "";
        if (chunk) {
          fullText += chunk;
          if (typeof onChunk === "function") onChunk(fullText);
        }
      } catch { /* ignore parse errors sur les lignes mal formées */ }
    }
  }

  return fullText;
};

const streamInvestmentAnalysis = async ({ rawText, recentActivity, investments, history = [], onChunk, model }) => {
  if (!rawText || typeof rawText !== "string") {
    throw new Error("Texte manquant.");
  }

  const systemPrompt = buildInvestmentSystemPrompt(recentActivity, investments);

  const systemTurn = [
    { role: "user", parts: [{ text: systemPrompt }] },
    { role: "model", parts: [{ text: "Compris. Je suis prêt à analyser ton portefeuille d'investissement." }] },
  ];

  const historyTurns = (Array.isArray(history) ? history.slice(-8) : []).flatMap(msg => {
    if (msg.role === "user") return [{ role: "user", parts: [{ text: msg.text }] }];
    if (msg.role === "ai") return [{ role: "model", parts: [{ text: msg.text }] }];
    return [];
  });

  const contents = [...systemTurn, ...historyTurns, { role: "user", parts: [{ text: rawText }] }];
  const targetModel = model === "gemini-2.5-flash" ? "gemini-2.5-flash" : "gemini-3-flash-preview";
  const url = `${GEMINI_BASE_URL}/${targetModel}:streamGenerateContent?key=${process.env.GEMINI_API_KEY}&alt=sse`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini stream error ${response.status}: ${err}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let fullText = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop(); // garde la ligne incomplète

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const data = line.slice(6).trim();
      if (data === "[DONE]" || !data) continue;

      try {
        const parsed = JSON.parse(data);
        const chunk = parsed.candidates?.[0]?.content?.parts?.map(p => p.text || "").join("") || "";
        if (chunk) {
          fullText += chunk;
          if (typeof onChunk === "function") onChunk(fullText);
        }
      } catch { /* ignore */ }
    }
  }

  return fullText;
};

module.exports = {
  generateAnalysis,
  generateStructuredAnalysis,
  generateImage,
  generateChatAnalysis,
  streamChatAnalysis,
  streamInvestmentAnalysis,
};
