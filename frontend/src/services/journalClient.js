import { buildApiUrl } from "../config/apiConfig";
import { ensureSuccess, jsonHeaders } from "./httpClient";

const JOURNAL_ENDPOINT = buildApiUrl("journal");

export const saveJournalEntry = async (entryData) => {
  const response = await fetch(JOURNAL_ENDPOINT, {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify(entryData),
  });

  const data = await ensureSuccess(response, "Le serveur n'a pas renvoyé l'entrée journal.");
  if (!data?.entry) {
    throw new Error("Le serveur n'a pas renvoyé l'entrée journal.");
  }
  return data.entry;
};

export const fetchJournalEntries = async () => {
  const response = await fetch(JOURNAL_ENDPOINT);
  const data = await ensureSuccess(response, "Impossible de récupérer les entrées du journal.");
  if (!Array.isArray(data?.entries)) {
    return [];
  }
  return data.entries;
};

export const updateJournalEntry = async (entryData) => {
  const { id, ...rest } = entryData;
  const response = await fetch(`${JOURNAL_ENDPOINT}/${id}`, {
    method: "PUT",
    headers: jsonHeaders,
    body: JSON.stringify(rest),
  });
  const data = await ensureSuccess(response, "Le serveur n'a pas renvoyé l'entrée mise à jour.");
  if (!data?.entry) {
    throw new Error("Le serveur n'a pas renvoyé l'entrée mise à jour.");
  }
  return data.entry;
};

export const deleteJournalEntry = async (id) => {
  const response = await fetch(`${JOURNAL_ENDPOINT}/${id}`, {
    method: "DELETE",
  });
  await ensureSuccess(response, "Impossible de supprimer l'entrée.");
  return true;
};
