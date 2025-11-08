const JOURNAL_ENDPOINT = "http://localhost:5050/api/journal";

export const saveJournalEntry = async ({ type, content, plan, transcript, metadata }) => {
  const body = JSON.stringify({ type, content, plan, transcript, metadata });
  const response = await fetch(JOURNAL_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const message =
      payload?.error || payload?.message || `Erreur serveur (${response.status})`;
    throw new Error(message);
  }

  const data = await response.json();
  if (!data?.entry) {
    throw new Error("Le serveur n'a pas renvoyé l'entrée journal.");
  }
  return data.entry;
};

export const fetchJournalEntries = async () => {
  const response = await fetch(JOURNAL_ENDPOINT);
  if (!response.ok) {
    const message = `Erreur serveur (${response.status})`;
    throw new Error(message);
  }
  const data = await response.json();
  if (!Array.isArray(data?.entries)) {
    return [];
  }
  return data.entries;
};

export const updateJournalEntry = async ({ id, type, content, plan, transcript, metadata }) => {
  const response = await fetch(`${JOURNAL_ENDPOINT}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, content, plan, transcript, metadata }),
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const message =
      payload?.error || payload?.message || `Erreur serveur (${response.status})`;
    throw new Error(message);
  }
  const data = await response.json();
  if (!data?.entry) {
    throw new Error("Le serveur n'a pas renvoyé l'entrée mise à jour.");
  }
  return data.entry;
};

export const deleteJournalEntry = async (id) => {
  const response = await fetch(`${JOURNAL_ENDPOINT}/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const message =
      payload?.error || payload?.message || `Erreur serveur (${response.status})`;
    throw new Error(message);
  }
  return true;
};
