import { buildApiUrl } from "../config/apiConfig";
import { ensureSuccess, jsonHeaders } from "./httpClient";

const DISCORD_ENDPOINT = buildApiUrl("discord");

export const publishToDiscord = async (payload) => {
  const response = await fetch(`${DISCORD_ENDPOINT}/publish`, {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify({ payload }),
  });
  return ensureSuccess(response, "Impossible de publier sur Discord.");
};

export const generateDiscordPostFromEntry = async ({ entryId, variant }) => {
  const response = await fetch(`${DISCORD_ENDPOINT}/generate`, {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify({ entryId, variant }),
  });
  const data = await ensureSuccess(response, "Impossible de générer le post Discord.");
  return data;
};

export const fetchDiscordStatus = async () => {
  const response = await fetch(`${DISCORD_ENDPOINT}/status`);
  return ensureSuccess(response, "Impossible de vérifier la configuration Discord.");
};
