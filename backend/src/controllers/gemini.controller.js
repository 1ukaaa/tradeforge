// backend/src/controllers/gemini.controller.js
const geminiService = require('../services/gemini.service');

const generateText = async (req, res) => {
  try {
    const result = await geminiService.generateAnalysis(req.body);
    res.json(result);
  } catch (err) {
    const status = err?.status || (err?.name === "RateLimitError" ? 429 : 500);
    res.status(status).json({ error: err.message });
  }
};

const generateStructured = async (req, res) => {
  try {
    const result = await geminiService.generateStructuredAnalysis(req.body);
    res.json(result);
  } catch (err) {
    const status = err?.status || (err?.name === "RateLimitError" ? 429 : 500);
    res.status(status).json({ error: err.message });
  }
};

const generateImage = async (req, res) => {
  try {
    const result = await geminiService.generateImage(req.body || {});
    res.json(result);
  } catch (err) {
    const status = err?.status || (err?.name === "RateLimitError" ? 429 : 500);
    res.status(status).json({ error: err.message });
  }
};

module.exports = {
  generateText,
  generateStructured,
  generateImage,
};
