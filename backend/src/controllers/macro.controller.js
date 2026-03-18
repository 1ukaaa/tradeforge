// backend/src/controllers/macro.controller.js
const macroService = require('../services/macro.service');

/**
 * GET /api/macro/indicators
 * Retourne la liste des indicateurs disponibles (metadata seulement)
 */
const getIndicatorsList = async (req, res) => {
  try {
    const list = macroService.getIndicatorsList();
    res.json({ indicators: list });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/macro/indicators/all?category=inflation
 * Retourne toutes les données (ou par catégorie)
 */
const getAllIndicators = async (req, res) => {
  try {
    const { category } = req.query;
    const data = await macroService.getAllIndicators(category || null);
    res.json({ indicators: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/macro/indicators/:key
 * Retourne les données d'un indicateur spécifique
 */
const getIndicator = async (req, res) => {
  try {
    const { key } = req.params;
    const data = await macroService.getIndicator(key.toUpperCase());
    res.json({ indicator: data });
  } catch (err) {
    if (err.message.includes('inconnu')) {
      return res.status(404).json({ error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
};

/**
 * POST /api/macro/indicators/:key/refresh
 * Force le rechargement depuis FRED (invalide le cache)
 */
const refreshIndicator = async (req, res) => {
  try {
    const { key } = req.params;
    const data = await macroService.refreshIndicator(key.toUpperCase());
    res.json({ indicator: data, refreshed: true });
  } catch (err) {
    if (err.message.includes('inconnu')) {
      return res.status(404).json({ error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getIndicatorsList,
  getAllIndicators,
  getIndicator,
  refreshIndicator,
};
