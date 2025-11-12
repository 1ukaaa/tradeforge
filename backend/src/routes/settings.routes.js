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

const router = Router();

// /api/settings
router.get('/', getSettings);
router.put('/', updateSettings);

// /api/prompt-variants
router.get('/prompt-variants', getPromptVariants);
router.put('/prompt-variants', updatePromptVariant);
router.delete('/prompt-variants', deletePromptVariant);

// /api/structured-templates
router.get('/structured-templates', getStructuredTemplates);
router.put('/structured-templates', updateStructuredTemplate);

module.exports = router;