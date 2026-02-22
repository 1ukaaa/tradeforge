import { buildApiUrl } from "../config/apiConfig";
import { ensureSuccess, jsonHeaders } from "./httpClient";

const BASE_URL = buildApiUrl("investments");

export const getInvestments = async () => {
    const response = await fetch(BASE_URL);
    return await ensureSuccess(response, "Impossible de charger les investissements.");
};

export const addInvestment = async (data) => {
    const response = await fetch(BASE_URL, {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify(data),
    });
    return await ensureSuccess(response, "Impossible d'ajouter l'investissement.");
};

export const updateInvestment = async (id, data) => {
    const response = await fetch(`${BASE_URL}/${id}`, {
        method: "PUT",
        headers: jsonHeaders,
        body: JSON.stringify(data),
    });
    return await ensureSuccess(response, "Impossible de modifier l'investissement.");
};

export const deleteInvestment = async (id) => {
    const response = await fetch(`${BASE_URL}/${id}`, {
        method: "DELETE",
    });
    return await ensureSuccess(response, "Impossible de supprimer l'investissement.");
};

export const getPortfolioChartData = async (period = '1y') => {
    const response = await fetch(`${BASE_URL}/chart?period=${period}`);
    return await ensureSuccess(response, "Impossible de charger le graphique.");
};
