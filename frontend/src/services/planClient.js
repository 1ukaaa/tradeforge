const PLAN_ENDPOINT = "http://localhost:5050/api/plan";

export const fetchPlan = async () => {
  const response = await fetch(PLAN_ENDPOINT);
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const message =
      payload?.error || payload?.message || `Erreur serveur (${response.status})`;
    throw new Error(message);
  }
  const data = await response.json();
  return {
    plan: data?.plan || null,
    updatedAt: data?.updatedAt || null,
  };
};

export const savePlan = async (plan) => {
  const response = await fetch(PLAN_ENDPOINT, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ plan }),
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const message =
      payload?.error || payload?.message || `Erreur serveur (${response.status})`;
    throw new Error(message);
  }
  const data = await response.json();
  return {
    plan: data?.plan || null,
    updatedAt: data?.updatedAt || null,
  };
};
