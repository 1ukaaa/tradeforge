// frontend/src/services/authClient.js
import { buildApiUrl } from "../config/apiConfig";
import { ensureSuccess, jsonHeaders } from "./httpClient";

const AUTH_ENDPOINT = buildApiUrl("auth");

export const checkAuthStatus = async () => {
  const response = await fetch(`${AUTH_ENDPOINT}/status`);
  const data = await ensureSuccess(response, "Erreur statut authentification");
  return data.authRequired;
};

export const verifyMasterPassword = async (password) => {
  const response = await fetch(`${AUTH_ENDPOINT}/verify`, {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify({ password }),
  });
  const data = await ensureSuccess(response, "Mot de passe incorrect.");
  return data.authenticated;
};
