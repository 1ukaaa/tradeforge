// frontend/src/services/economicClient.js
import { buildApiUrl } from "../config/apiConfig";
import { ensureSuccess } from "./httpClient";

const ECONOMIC_ENDPOINT = buildApiUrl("economic-events");

export const fetchEconomicEvents = async () => {
  const response = await fetch(ECONOMIC_ENDPOINT);
  const data = await ensureSuccess(response, "Impossible de récupérer les annonces économiques.");
  return data?.events || [];
};
