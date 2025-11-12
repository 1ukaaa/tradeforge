// backend/src/controllers/settings.controller.js
const settingsService = require('../services/settings.service');

const getSettings = (req, res) => {
  try {
    const settings = settingsService.getSettings();
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateSettings = (req, res) => {
  const { structuredVariant, analysisVariant, tradeVariant } = req.body;
  const updates = { structuredVariant, analysisVariant, tradeVariant };

  if (Object.values(updates).every(v => v === undefined)) {
    return res.status(400).json({ error: "Aucun champ à mettre à jour." });
  }
  
  try {
    const newSettings = settingsService.updateSettings(updates);
    res.json(newSettings);
  } catch (err) {
    console.error("Erreur settings :", err);
    res.status(500).json({ error: "Impossible de mettre à jour les paramètres." });
  }
};

const getPromptVariants = (req, res) => {
  try {
    const variants = settingsService.getPromptVariants();
    res.json({ variants });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updatePromptVariant = (req, res) => {
  const { type, variant, prompt } = req.body;
  if (!type || !variant || !prompt) {
    return res.status(400).json({ error: "Type, variant ou prompt manquant." });
  }
  try {
    const updated = settingsService.upsertPromptVariant(type, variant, prompt);
    res.json({ variant: updated });
  } catch (err) {
    console.error("Erreur prompt variant :", err);
    res.status(500).json({ error: "Impossible de mettre à jour le template." });
  }
};

const deletePromptVariant = (req, res) => {
  const { type, variant } = req.body;
  if (!type || !variant) {
    return res.status(400).json({ error: "Type ou variant manquant." });
  }
  if (variant === "default") {
    return res.status(400).json({ error: "La variante ‘default’ est système et ne peut pas être supprimée." });
  }
  try {
    const deleted = settingsService.deletePromptVariant(type, variant);
    if (!deleted) {
      return res.status(404).json({ error: "Variante introuvable." });
    }
    res.json({ success: true });
  } catch (err) {
    console.error("Erreur suppression variante :", err);
    res.status(500).json({ error: "Impossible de supprimer la variante." });
  }
};

const getStructuredTemplates = (req, res) => {
  try {
    const templates = settingsService.getStructuredTemplates();
    res.json({ templates });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateStructuredTemplate = (req, res) => {
  const { variant, prompt } = req.body;
  if (!variant || !prompt) {
    return res.status(400).json({ error: "Variant ou prompt manquant." });
  }
  try {
    const updated = settingsService.upsertStructuredTemplate(variant, prompt);
    res.json({ structuredTemplate: updated });
  } catch (err) {
    console.error("Erreur template :", err);
    res.status(500).json({ error: "Impossible d’enregistrer le template." });
  }
};

module.exports = {
  getSettings,
  updateSettings,
  getPromptVariants,
  updatePromptVariant,
  deletePromptVariant,
  getStructuredTemplates,
  updateStructuredTemplate,
};