// backend/src/routes/index.js
const { Router } = require('express');
const journalRoutes = require('./journal.routes');
const planRoutes = require('./plan.routes');
const settingsRoutes = require('./settings.routes');
const geminiRoutes = require('./gemini.routes');
// 1. AJOUTER L'IMPORT
const economicController = require("../controllers/economic.controller");

const router = Router();

router.use('/journal', journalRoutes);
router.use('/plan', planRoutes);
router.use('/settings', settingsRoutes);
router.use('/prompt-variants', settingsRoutes); // Note: J'utilise le même routeur pour la simplicité
router.use('/structured-templates', settingsRoutes); // Idem
router.use('/gemini', geminiRoutes);

// 2. AJOUTER LA NOUVELLE ROUTE
router.get("/economic-events", economicController.getEvents);

module.exports = router;