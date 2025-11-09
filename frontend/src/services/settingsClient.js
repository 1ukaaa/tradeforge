const SETTINGS_ENDPOINT = "http://localhost:5050/api/settings";

export const fetchSettings = async () => {
  const response = await fetch(SETTINGS_ENDPOINT);
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const message =
      payload?.error || payload?.message || `Erreur serveur (${response.status})`;
    throw new Error(message);
  }
  const data = await response.json();
  return {
    structuredVariant: data?.structuredVariant || null,
    analysisVariant: data?.analysisVariant || null,
    tradeVariant: data?.tradeVariant || null,
  };
};

export const saveSettings = async (settings) => {
  const response = await fetch(SETTINGS_ENDPOINT, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(settings),
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const message =
      payload?.error || payload?.message || `Erreur serveur (${response.status})`;
    throw new Error(message);
  }
  const data = await response.json();
  return {
    structuredVariant: data?.structuredVariant || null,
    analysisVariant: data?.analysisVariant || null,
    tradeVariant: data?.tradeVariant || null,
  };
};

export const fetchPromptVariants = async () => {
  const response = await fetch("http://localhost:5050/api/prompt-variants");
  if (!response.ok) {
    throw new Error(`Erreur serveur (${response.status})`);
  }
  const data = await response.json();
  return data.variants || {};
};

export const savePromptVariant = async (type, variant, prompt) => {
  const response = await fetch("http://localhost:5050/api/prompt-variants", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, variant, prompt }),
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const message =
      payload?.error || payload?.message || `Erreur serveur (${response.status})`;
    throw new Error(message);
  }
  const data = await response.json();
  return data.variant;
};

export const deletePromptVariant = async (type, variant) => {
  const response = await fetch("http://localhost:5050/api/prompt-variants", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, variant }),
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const message =
      payload?.error || payload?.message || `Erreur serveur (${response.status})`;
    throw new Error(message);
  }
  return response.json();
};

export const fetchStructuredTemplates = async () => {
  const response = await fetch("http://localhost:5050/api/structured-templates");
  if (!response.ok) {
    throw new Error(`Erreur serveur (${response.status})`);
  }
  const data = await response.json();
  return data.templates || [];
};

export const saveStructuredTemplate = async (variant, prompt) => {
  const response = await fetch("http://localhost:5050/api/structured-templates", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ variant, prompt }),
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const message =
      payload?.error || payload?.message || `Erreur serveur (${response.status})`;
    throw new Error(message);
  }
  const data = await response.json();
  return data.structuredTemplate;
};
