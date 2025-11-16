import { buildApiUrl } from "../config/apiConfig";
import { ensureSuccess, jsonHeaders } from "./httpClient";

const TWITTER_ENDPOINT = buildApiUrl("twitter");

const buildDraftUrl = (id) => `${TWITTER_ENDPOINT}/drafts${id ? `/${id}` : ""}`;

export const fetchTwitterDrafts = async () => {
  const response = await fetch(buildDraftUrl());
  const data = await ensureSuccess(response, "Impossible de récupérer les brouillons Twitter.");
  return data?.drafts || [];
};

export const createTwitterDraft = async (payload = {}) => {
  const response = await fetch(buildDraftUrl(), {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify(payload),
  });
  const data = await ensureSuccess(response, "Impossible de créer le brouillon Twitter.");
  return data?.draft || null;
};

export const updateTwitterDraft = async (id, payload) => {
  const response = await fetch(buildDraftUrl(id), {
    method: "PUT",
    headers: jsonHeaders,
    body: JSON.stringify(payload),
  });
  const data = await ensureSuccess(response, "Impossible de mettre à jour le brouillon.");
  return data?.draft || null;
};

export const deleteTwitterDraft = async (id) => {
  const response = await fetch(buildDraftUrl(id), {
    method: "DELETE",
  });
  await ensureSuccess(response, "Impossible de supprimer le brouillon.");
  return true;
};

export const publishTwitterDraft = async (id) => {
  const response = await fetch(`${buildDraftUrl(id)}/publish`, {
    method: "POST",
  });
  const data = await ensureSuccess(response, "Impossible de publier le brouillon.");
  return data;
};

export const generateTwitterFromEntry = async ({ entryId, variant }) => {
  const response = await fetch(`${TWITTER_ENDPOINT}/generate`, {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify({ entryId, variant }),
  });
  return ensureSuccess(response, "Impossible de générer le contenu Twitter.");
};
