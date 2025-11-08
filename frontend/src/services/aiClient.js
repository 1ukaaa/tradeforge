const GEMINI_ENDPOINT = "http://localhost:5050/api/gemini";

export const requestAnalysis = async ({ rawText, template = "analysis.v1", plan }) => {
  const body = JSON.stringify({ rawText, template, plan });
  const response = await fetch(GEMINI_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });

  if (!response.ok) {
    const message = `Erreur serveur (${response.status})`;
    throw new Error(message);
  }

  const data = await response.json();
  if (!data?.result) {
    throw new Error("Réponse vide de l'assistant");
  }
  return data.result;
};
