// frontend/src/services/shareClient.js
import { buildApiUrl } from "../config/apiConfig";
import { ensureSuccess, jsonHeaders } from "./httpClient";

const SHARE_ENDPOINT = buildApiUrl("share");
const SHARED_ENDPOINT = buildApiUrl("shared");

// ─── Routes propriétaire ────────────────────────────────────────────

export const createShareLink = async ({ pin, label = "" }) => {
  const response = await fetch(SHARE_ENDPOINT, {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify({ pin, label }),
  });
  const data = await ensureSuccess(response, "Impossible de créer le lien.");
  return data.link;
};

export const fetchShareLinks = async () => {
  const response = await fetch(SHARE_ENDPOINT);
  const data = await ensureSuccess(response, "Impossible de lister les liens.");
  return data.links || [];
};

export const deleteShareLink = async (id) => {
  const response = await fetch(`${SHARE_ENDPOINT}/${id}`, {
    method: "DELETE",
  });
  await ensureSuccess(response, "Impossible de supprimer le lien.");
  return true;
};

export const revokeShareLink = async (id) => {
  const response = await fetch(`${SHARE_ENDPOINT}/${id}/revoke`, {
    method: "PATCH",
  });
  await ensureSuccess(response, "Impossible de révoquer le lien.");
  return true;
};

// ─── Routes publiques (accès partagé) ───────────────────────────────

export const checkShareToken = async (token) => {
  const response = await fetch(`${SHARED_ENDPOINT}/${token}/check`);
  const data = await ensureSuccess(response, "Lien invalide.");
  return data;
};

export const authenticateShare = async (token, pin) => {
  const response = await fetch(`${SHARED_ENDPOINT}/${token}/auth`, {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify({ pin }),
  });
  const data = await ensureSuccess(response, "Authentification échouée.");
  return data;
};

export const fetchSharedJournal = async (token, pin) => {
  const response = await fetch(`${SHARED_ENDPOINT}/${token}/journal`, {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify({ pin }),
  });
  const data = await ensureSuccess(response, "Impossible de charger le journal.");
  return data.entries || [];
};
