import { buildApiUrl } from "../config/apiConfig";
import { ensureSuccess } from "./httpClient";

const INTEGRATIONS_ENDPOINT = buildApiUrl("integrations");

export const fetchIntegrations = async () => {
  const response = await fetch(INTEGRATIONS_ENDPOINT);
  const data = await ensureSuccess(response, "Impossible de récupérer les intégrations.");
  return data || {};
};
