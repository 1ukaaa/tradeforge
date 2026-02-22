// backend/src/routes/aiMemory.routes.js
const { Router } = require("express");
const ctrl = require("../controllers/aiMemory.controller");

const router = Router();

// Sessions
router.get("/sessions", ctrl.getSessions);    // Liste toutes les sessions
router.post("/sessions", ctrl.createSession);  // Créer une session
router.patch("/sessions/:sessionId", ctrl.renameSession);  // Renommer
router.delete("/sessions/:sessionId", ctrl.deleteSession);  // Supprimer session + messages

// Messages d'une session
router.get("/messages", ctrl.getMessages);    // ?sessionId=xxx
router.delete("/sessions/:sessionId/messages", ctrl.clearSession); // Vider une session

module.exports = router;
