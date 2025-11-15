import { buildApiUrl } from "../config/apiConfig";
import { ensureSuccess, jsonHeaders } from "./httpClient";

const SETTINGS_ENDPOINT = buildApiUrl("settings");
const PROMPT_VARIANTS_ENDPOINT = buildApiUrl("prompt-variants");
const STRUCTURED_TEMPLATES_ENDPOINT = buildApiUrl("structured-templates");

export const fetchSettings = async () => {
  const response = await fetch(SETTINGS_ENDPOINT);
  const data = await ensureSuccess(response, "Impossible de récupérer les paramètres.");
  // Inclure les nouveaux champs
  return {
    structuredVariant: data?.structuredVariant || null,
    analysisVariant: data?.analysisVariant || null,
    tradeVariant: data?.tradeVariant || null,
    accountName: data?.accountName || "Luka",
    capitalForex: data?.capitalForex || 0,
    capitalCrypto: data?.capitalCrypto || 0,
    capitalForexCurrency: data?.capitalForexCurrency || "EUR", // NOUVEAU
    capitalCryptoCurrency: data?.capitalCryptoCurrency || "USD", // NOUVEAU
  };
};

export const saveSettings = async (settings) => {
  const response = await fetch(SETTINGS_ENDPOINT, {
    method: "PUT",
    headers: jsonHeaders,
    body: JSON.stringify(settings), // Envoie tous les champs (y compris les nouveaux)
  });
  const data = await ensureSuccess(response, "Impossible d'enregistrer les paramètres.");
  // Retourner les nouveaux champs
  return {
    structuredVariant: data?.structuredVariant || null,
    analysisVariant: data?.analysisVariant || null,
    tradeVariant: data?.tradeVariant || null,
    accountName: data?.accountName || "Luka",
    capitalForex: data?.capitalForex || 0,
    capitalCrypto: data?.capitalCrypto || 0,
    capitalForexCurrency: data?.capitalForexCurrency || "EUR", // NOUVEAU
    capitalCryptoCurrency: data?.capitalCryptoCurrency || "USD", // NOUVEAU
  };
};

export const fetchPromptVariants = async () => {
  const response = await fetch(PROMPT_VARIANTS_ENDPOINT);
  const data = await ensureSuccess(response, "Impossible de récupérer les variantes de prompt.");
  return data.variants || {};
};

export const savePromptVariant = async (type, variant, prompt) => {
  const response = await fetch(PROMPT_VARIANTS_ENDPOINT, {
    method: "PUT",
    headers: jsonHeaders,
    body: JSON.stringify({ type, variant, prompt }),
  });
  const data = await ensureSuccess(response, "Impossible de sauvegarder la variante.");
  return data.variant;
};

export const deletePromptVariant = async (type, variant) => {
  const response = await fetch(PROMPT_VARIANTS_ENDPOINT, {
    method: "DELETE",
    headers: jsonHeaders,
    body: JSON.stringify({ type, variant }),
  });
  const data = await ensureSuccess(response, "Impossible de supprimer la variante.");
  return data;
};

export const fetchStructuredTemplates = async () => {
  const response = await fetch(STRUCTURED_TEMPLATES_ENDPOINT);
  const data = await ensureSuccess(
    response,
    "Impossible de récupérer les templates structurés."
  );
  return data.templates || [];
};

export const saveStructuredTemplate = async (variant, prompt) => {
  const response = await fetch(STRUCTURED_TEMPLATES_ENDPOINT, {
    method: "PUT",
    headers: jsonHeaders,
    body: JSON.stringify({ variant, prompt }),
  });
  const data = await ensureSuccess(response, "Impossible de sauvegarder le template.");
  return data.structuredTemplate;
};