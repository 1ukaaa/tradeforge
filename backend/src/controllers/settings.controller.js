// backend/src/controllers/settings.controller.js
const settingsService = require('../services/settings.service');

// --- Prompts ---

const getPromptVariant = async (req, res) => { // ASYNC
  const { type, variant } = req.params;
  try {
    const data = await settingsService.getPromptVariant(type, variant); // AWAIT
    if (!data) return res.status(404).json({ error: "Variant introuvable" });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Erreur récupération variant" });
  }
};

const upsertPromptVariant = async (req, res) => { // ASYNC
  const { type, variant } = req.params;
  const { prompt } = req.body;
  try {
    const result = await settingsService.upsertPromptVariant(type, variant, prompt); // AWAIT
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Erreur sauvegarde variant" });
  }
};

const deletePromptVariant = async (req, res) => { // ASYNC
  const { type, variant } = req.params;
  try {
    const success = await settingsService.deletePromptVariant(type, variant); // AWAIT
    if (!success) return res.status(404).json({ error: "Introuvable" });
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: "Erreur suppression" });
  }
};

const getPromptVariants = async (req, res) => { // ASYNC
  try {
    const variants = await settingsService.getPromptVariants(); // AWAIT
    res.json(variants);
  } catch (err) {
    res.status(500).json({ error: "Erreur listing variants" });
  }
};

// --- Structured Templates ---

const getStructuredTemplate = async (req, res) => { // ASYNC
  const { variant } = req.params;
  try {
    const data = await settingsService.getStructuredTemplate(variant); // AWAIT
    if (!data) return res.status(404).json({ error: "Template introuvable" });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Erreur récupération template" });
  }
};

const upsertStructuredTemplate = async (req, res) => { // ASYNC
  const { variant } = req.params;
  const { prompt } = req.body;
  try {
    const result = await settingsService.upsertStructuredTemplate(variant, prompt); // AWAIT
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Erreur sauvegarde template" });
  }
};

const getStructuredTemplates = async (req, res) => { // ASYNC
  try {
    const templates = await settingsService.getStructuredTemplates(); // AWAIT
    res.json(templates);
  } catch (err) {
    res.status(500).json({ error: "Erreur listing templates" });
  }
};

// --- App Settings ---

const getSettings = async (req, res) => { // ASYNC
  try {
    const settings = await settingsService.getSettings(); // AWAIT
    res.json(settings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur récupération settings" });
  }
};

const updateSettings = async (req, res) => { // ASYNC
  try {
    const settings = await settingsService.updateSettings(req.body); // AWAIT
    res.json(settings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur mise à jour settings" });
  }
};

module.exports = {
  getPromptVariant,
  upsertPromptVariant,
  deletePromptVariant,
  getPromptVariants,
  getStructuredTemplate,
  upsertStructuredTemplate,
  getStructuredTemplates,
  getSettings,
  updateSettings,
};