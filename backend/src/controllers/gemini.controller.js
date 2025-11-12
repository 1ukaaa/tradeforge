// backend/src/controllers/gemini.controller.js
const geminiService = require('../services/gemini.service');

const generateText = async (req, res) => {
  try {
    const result = await geminiService.generateAnalysis(req.body);
    res.json(result);
  } catch (err) {
    res.status(500).json({ result: err.message });
  }
};

const generateStructured = async (req, res) => {
  try {
    const result = await geminiService.generateStructuredAnalysis(req.body);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  generateText,
  generateStructured,
};