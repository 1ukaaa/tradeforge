const parseJsonSafe = async (response) => {
  try {
    const body = await response.text();
    if (!body) {
      return null;
    }
    return JSON.parse(body);
  } catch {
    return null;
  }
};

export const jsonHeaders = { "Content-Type": "application/json" };

export const ensureSuccess = async (response, fallbackMessage) => {
  const payload = await parseJsonSafe(response);
  if (!response.ok) {
    const message =
      payload?.error || payload?.message || fallbackMessage || `Erreur serveur (${response.status})`;
    throw new Error(message);
  }
  return payload;
};
