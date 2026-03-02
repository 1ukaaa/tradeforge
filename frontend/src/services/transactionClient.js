import { buildApiUrl } from "../config/apiConfig";
import { ensureSuccess, jsonHeaders } from "./httpClient";

const BASE_URL = buildApiUrl("transactions");

export const getTransactions = async (investmentId) => {
    const response = await fetch(`${BASE_URL}/${investmentId}`);
    return await ensureSuccess(response, "Impossible de charger les transactions.");
};

export const getAllTransactions = async () => {
    const response = await fetch(BASE_URL);
    return await ensureSuccess(response, "Impossible de charger l'historique.");
};

export const addTransaction = async (investmentId, data) => {
    const response = await fetch(`${BASE_URL}/${investmentId}`, {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify(data),
    });
    return await ensureSuccess(response, "Impossible d'ajouter la transaction.");
};

export const deleteTransaction = async (txId) => {
    const response = await fetch(`${BASE_URL}/tx/${txId}`, {
        method: "DELETE",
    });
    return await ensureSuccess(response, "Impossible de supprimer la transaction.");
};
