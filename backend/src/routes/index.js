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

const router = Router();

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

module.exports = router;
