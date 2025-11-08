const JOURNAL_ENDPOINT = "http://localhost:5050/api/journal";

export const saveJournalEntry = async ({ type, content, plan, transcript }) => {
  const body = JSON.stringify({ type, content, plan, transcript });
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
