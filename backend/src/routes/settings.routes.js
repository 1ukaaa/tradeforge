// backend/src/routes/settings.routes.js
const { Router } = require('express');
const {
  getSettings,
  updateSettings,
  getPromptVariants,
  updatePromptVariant,
  deletePromptVariant,
  getStructuredTemplates,
  updateStructuredTemplate,
} = require('../controllers/settings.controller');

const settingsRouter = Router();
settingsRouter.get('/', getSettings);
settingsRouter.put('/', updateSettings);

const promptVariantsRouter = Router();
promptVariantsRouter.get('/', getPromptVariants);
promptVariantsRouter.put('/', updatePromptVariant);
promptVariantsRouter.delete('/', deletePromptVariant);

const structuredTemplatesRouter = Router();
structuredTemplatesRouter.get('/', getStructuredTemplates);
structuredTemplatesRouter.put('/', updateStructuredTemplate);

module.exports = {
  settingsRouter,
  promptVariantsRouter,
  structuredTemplatesRouter,
};
