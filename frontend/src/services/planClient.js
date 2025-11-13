import { buildApiUrl } from "../config/apiConfig";
import { ensureSuccess, jsonHeaders } from "./httpClient";

const PLAN_ENDPOINT = buildApiUrl("plan");

export const fetchPlan = async () => {
  const response = await fetch(PLAN_ENDPOINT);
  const data = await ensureSuccess(response, "Impossible de charger le plan.");
  return {
    plan: data?.plan || null,
    updatedAt: data?.updatedAt || null,
  };
};

export const savePlan = async (plan) => {
  const response = await fetch(PLAN_ENDPOINT, {
    method: "PUT",
    headers: jsonHeaders,
    body: JSON.stringify({ plan }),
  });
  const data = await ensureSuccess(response, "Impossible d'enregistrer le plan.");
  return {
    plan: data?.plan || null,
    updatedAt: data?.updatedAt || null,
  };
};
