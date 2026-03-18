// backend/src/routes/index.js
const { Router } = require('express');
const journalRoutes = require('./journal.routes');
const planRoutes = require('./plan.routes');
const {
  settingsRouter,
  promptVariantsRouter,
  structuredTemplatesRouter,
} = require('./settings.routes');
const geminiRoutes = require('./gemini.routes');
const economicRoutes = require('./economic.routes');
const brokerRoutes = require('./broker.routes');
const integrationsRoutes = require('./integrations.routes');
const twitterRoutes = require('./twitter.routes');
const discordRoutes = require('./discord.routes');
const aiMemoryRoutes = require('./aiMemory.routes');
const investmentRoutes = require('./investment.routes');
const transactionRoutes = require('./transaction.routes');
const { shareRouter, publicRouter: sharedPublicRouter } = require('./share.routes');
const authRoutes = require('./auth.routes');
const macroRoutes = require('./macro.routes');

const router = Router();

// Authentification globale
router.use('/auth', authRoutes);

router.use('/journal', journalRoutes);
router.use('/plan', planRoutes);
router.use('/settings', settingsRouter);
router.use('/prompt-variants', promptVariantsRouter);
router.use('/structured-templates', structuredTemplatesRouter);
router.use('/gemini', geminiRoutes);

router.use("/economic-events", economicRoutes);
router.use('/broker', brokerRoutes);
router.use('/integrations', integrationsRoutes);
router.use('/twitter', twitterRoutes);
router.use('/discord', discordRoutes);
router.use('/ai-memory', aiMemoryRoutes);
router.use('/investments', investmentRoutes);
router.use('/transactions', transactionRoutes);
router.use('/macro', macroRoutes);

// Partage du journal
router.use('/share', shareRouter);       // Routes propriétaire (CRUD liens)
router.use('/shared', sharedPublicRouter); // Routes publiques (accès lecture seule)

module.exports = router;
