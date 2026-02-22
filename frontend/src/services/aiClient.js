import { buildApiUrl } from "../config/apiConfig";
import { ensureSuccess, jsonHeaders } from "./httpClient";

const GEMINI_ENDPOINT = buildApiUrl("gemini");

export const requestAnalysis = async ({ rawText, template = "analysis.v1", plan }) => {
  const response = await fetch(GEMINI_ENDPOINT, {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify({ rawText, template, plan }),
  });

  const data = await ensureSuccess(response, "Impossible de générer l'analyse.");
  if (!data?.result) {
    throw new Error("Réponse vide de l'assistant.");
  }
  return data.result;
};

export const requestStructuredAnalysis = async ({ rawText, entryType = "analyse", plan, variant }) => {
  const response = await fetch(`${GEMINI_ENDPOINT}/structured`, {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify({ rawText, entryType, plan, variant }),
  });
  const data = await ensureSuccess(response, "Impossible de générer l'analyse structurée.");
  return data.structured || null;
};

export const generateGeminiImage = async ({ prompt }) => {
  const response = await fetch(`${GEMINI_ENDPOINT}/image`, {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify({ prompt }),
  });
  const data = await ensureSuccess(response, "Impossible de générer l'image.");
  if (!data?.image) {
    throw new Error("Gemini n'a pas renvoyé d'image.");
  }
  return data;
};

/**
 * @param {string} rawText       - Message courant de l'utilisateur.
 * @param {string} plan          - Plan de trading.
 * @param {Array}  recentTrades  - Entrées du journal filtrées.
 * @param {Array}  accounts      - Comptes sélectionnés (pour sauvegarde en DB).
 * @param {string} sessionId     - ID de la session de chat active.
 */
export const requestChatAnalysis = async ({ rawText, plan, recentTrades, accounts = [], sessionId = "default", model }) => {
  const response = await fetch(`${GEMINI_ENDPOINT}/chat`, {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify({ rawText, plan, recentTrades, accounts, sessionId, model }),
  });

  const data = await ensureSuccess(response, "Impossible de générer l'analyse.");
  if (!data?.result) {
    throw new Error("Réponse vide de l'assistant.");
  }
  return data.result;
};

/**
 * Version streaming : envoie les chunks au fur et à mesure via onChunk(text).
 * Appelle onDone(fullText) quand la génération est terminée.
 * @param {Function} onChunk  - Appelé avec le texte accumulé à chaque chunk
 * @param {Function} onDone   - Appelé avec le texte final complet
 * @param {Function} onError  - Appelé en cas d'erreur
 */
export const requestChatAnalysisStream = async ({
  rawText, plan, recentTrades, accounts = [], sessionId = "default", model,
  onChunk, onDone, onError,
}) => {
  const response = await fetch(`${GEMINI_ENDPOINT}/chat/stream`, {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify({ rawText, plan, recentTrades, accounts, sessionId, model }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Stream error ${response.status}: ${err}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop();

    let eventType = "";
    for (const line of lines) {
      if (line.startsWith("event: ")) {
        eventType = line.slice(7).trim();
      } else if (line.startsWith("data: ")) {
        const raw = line.slice(6).trim();
        if (!raw) continue;
        try {
          const payload = JSON.parse(raw);
          if (eventType === "chunk" && payload.text !== undefined) {
            onChunk?.(payload.text);
          } else if (eventType === "done") {
            onDone?.(payload.text ?? "");
            return;
          } else if (eventType === "error") {
            onError?.(new Error(payload.message || "Erreur inconnue."));
            return;
          }
        } catch { /* ignore */ }
        eventType = ""; // reset après chaque data
      }
    }
  }
};
