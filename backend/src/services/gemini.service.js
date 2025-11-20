// backend/src/services/gemini.service.js
const axios = require("axios");
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

const buildGeminiUrl = (model, method = "generateContent") =>
  `${GEMINI_BASE_URL}/${model}:${method}?key=${process.env.GEMINI_API_KEY}`;

// --- Utils ---

const formatTemplate = (template = "", data = {}) =>
  template.replace(/\{\{(\w+)\}\}/g, (_, key) => data[key] ?? "");

const getActiveVariant = (type, overrideVariant) =>
  overrideVariant ||
  getSetting(`${type}_variant`)?.value ||
  "default";

// --- Prompt Builders ---

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

// --- API Call Logic ---

const callGeminiAPI = async (payload) => {
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
  const prompt = buildPrompt(promptType, rawText, activePlan, variant);

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
    getSetting("structured_variant")?.value ||
    DEFAULT_STRUCTURED_VARIANT;
  
  const prompt = buildStructuredPrompt(rawText, entryType, plan, configuredVariant);

  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      response_mime_type: "application/json",
    },
  };

  const resultText = await callGeminiAPI(payload);
  const parsed = JSON.parse(resultText);
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


module.exports = {
  generateAnalysis,
  generateStructuredAnalysis,
  generateImage,
};
