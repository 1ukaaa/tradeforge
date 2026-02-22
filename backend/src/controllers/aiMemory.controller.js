// backend/src/controllers/aiMemory.controller.js
const svc = require("../services/aiMemory.service");

// ── Sessions ──────────────────────────────────────────────────────────────────

const getSessions = async (req, res) => {
    try {
        const sessions = await svc.getSessions();
        res.json({ sessions });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

const createSession = async (req, res) => {
    try {
        const session = await svc.createSession({ name: req.body?.name });
        res.status(201).json({ session });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

const renameSession = async (req, res) => {
    try {
        await svc.renameSession(req.params.sessionId, req.body.name);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

const deleteSession = async (req, res) => {
    try {
        await svc.deleteSession(req.params.sessionId);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

// ── Messages ──────────────────────────────────────────────────────────────────

const getMessages = async (req, res) => {
    try {
        const sessionId = req.query.sessionId || "default";
        const messages = await svc.getMessages(sessionId);
        res.json({ messages });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

const clearSession = async (req, res) => {
    try {
        const sessionId = req.params.sessionId || "default";
        await svc.clearSession(sessionId);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

module.exports = { getSessions, createSession, renameSession, deleteSession, getMessages, clearSession };
