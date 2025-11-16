import { buildApiUrl } from "../config/apiConfig";
import { ensureSuccess } from "./httpClient";

const BROKER_ENDPOINT = buildApiUrl("broker");

export const fetchBrokerSummary = async ({ signal } = {}) => {
  const response = await fetch(`${BROKER_ENDPOINT}/summary`, { signal });
  const data = await ensureSuccess(response, "Impossible de récupérer le dashboard broker.");
  return data;
};

export const fetchBrokerTrades = async ({ accountId, limit } = {}) => {
  const params = new URLSearchParams();
  if (accountId) params.append("accountId", accountId);
  if (limit) params.append("limit", limit);
  const query = params.toString() ? `?${params.toString()}` : "";
  const response = await fetch(`${BROKER_ENDPOINT}/trades${query}`);
  const data = await ensureSuccess(response, "Impossible de récupérer les trades broker.");
  return data.trades || [];
};

export const fetchBrokerPositions = async ({ accountId, order } = {}) => {
  const params = new URLSearchParams();
  if (accountId) params.append("accountId", accountId);
  if (order) params.append("order", order);
  const query = params.toString() ? `?${params.toString()}` : "";
  const response = await fetch(`${BROKER_ENDPOINT}/positions${query}`);
  const data = await ensureSuccess(response, "Impossible de récupérer les positions broker.");
  return data.positions || [];
};

export const fetchBrokerAccounts = async () => {
  const response = await fetch(`${BROKER_ENDPOINT}/accounts`);
  const data = await ensureSuccess(response, "Impossible de récupérer les comptes broker.");
  return data.accounts || [];
};

export const createBrokerAccount = async (payload) => {
  const response = await fetch(`${BROKER_ENDPOINT}/accounts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await ensureSuccess(response, "Impossible de créer le compte.");
  return data.account;
};

export const syncBrokerAccount = async (accountId) => {
  const response = await fetch(`${BROKER_ENDPOINT}/accounts/${accountId}/sync`, {
    method: "POST",
  });
  return ensureSuccess(response, "Impossible de synchroniser le compte.");
};

export const importBrokerCsv = async (accountId, file) => {
  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch(`${BROKER_ENDPOINT}/accounts/${accountId}/import`, {
    method: "POST",
    body: formData,
  });
  return ensureSuccess(response, "Impossible d'importer le CSV.");
};
