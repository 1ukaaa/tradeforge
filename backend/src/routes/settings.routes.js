// backend/src/routes/settings.routes.js
const { Router } = require('express');
const {
  getSettings,
  updateSettings,
  getPromptVariants,
  upsertPromptVariant,
  deletePromptVariant,
  getStructuredTemplates,
  upsertStructuredTemplate,
} = require('../controllers/settings.controller');

const settingsRouter = Router();
settingsRouter.get('/', getSettings);
settingsRouter.put('/', updateSettings);

const promptVariantsRouter = Router();
promptVariantsRouter.get('/', getPromptVariants);
promptVariantsRouter.put('/', upsertPromptVariant);
promptVariantsRouter.delete('/', deletePromptVariant);

const structuredTemplatesRouter = Router();
structuredTemplatesRouter.get('/', getStructuredTemplates);
structuredTemplatesRouter.put('/', upsertStructuredTemplate);

module.exports = {
  settingsRouter,
  promptVariantsRouter,
  structuredTemplatesRouter,
};
