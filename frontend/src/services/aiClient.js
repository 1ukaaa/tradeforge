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
