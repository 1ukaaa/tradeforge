// frontend/src/services/aiMemoryClient.js
import { buildApiUrl } from "../config/apiConfig";
import { ensureSuccess, jsonHeaders } from "./httpClient";

const BASE = buildApiUrl("ai-memory");

// ── Sessions ──────────────────────────────────────────────────────────────────

export const fetchSessions = async () => {
    const res = await fetch(`${BASE}/sessions`);
    const data = await ensureSuccess(res, "Impossible de charger les sessions.");
    return data.sessions || [];
};

export const createSession = async (name = "Nouveau chat") => {
    const res = await fetch(`${BASE}/sessions`, {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify({ name }),
    });
    const data = await ensureSuccess(res, "Impossible de créer la session.");
    return data.session;
};

export const renameSession = async (sessionId, name) => {
    await fetch(`${BASE}/sessions/${sessionId}`, {
        method: "PATCH",
        headers: jsonHeaders,
        body: JSON.stringify({ name }),
    });
};

export const deleteSession = async (sessionId) => {
    await fetch(`${BASE}/sessions/${sessionId}`, { method: "DELETE" });
};

// ── Messages ──────────────────────────────────────────────────────────────────

export const fetchAIMemory = async (sessionId = "default") => {
    const res = await fetch(`${BASE}/messages?sessionId=${encodeURIComponent(sessionId)}`);
    const data = await ensureSuccess(res, "Impossible de charger la mémoire AI.");
    return data.messages || [];
};

export const clearAIMemory = async (sessionId = "default") => {
    await fetch(`${BASE}/sessions/${sessionId}/messages`, { method: "DELETE" });
};
