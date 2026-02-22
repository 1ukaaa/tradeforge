// backend/src/controllers/gemini.controller.js
const geminiService = require('../services/gemini.service');
const aiMemoryService = require('../services/aiMemory.service');

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

const generateChat = async (req, res) => {
  try {
    const { rawText, plan, recentTrades, accounts, sessionId = "default", model } = req.body;

    // 1. Charger l'historique persistant de la session concernée
    const persistentHistory = await aiMemoryService.getHistoryForGemini(sessionId);

    // 2. Sauvegarder le message utilisateur
    await aiMemoryService.saveMessage({
      sessionId,
      role: 'user',
      text: rawText,
      accounts: accounts || null,
    });

    // 3. Appel Gemini avec l'historique persistant de la session
    const result = await geminiService.generateChatAnalysis({
      rawText,
      plan,
      recentTrades,
      history: persistentHistory,
      model,
    });

    // 4. Sauvegarder la réponse AI dans la même session
    await aiMemoryService.saveMessage({
      sessionId,
      role: 'ai',
      text: result.result,
      accounts: accounts || null,
    });

    res.json(result);
  } catch (err) {
    const status = err?.status || (err?.name === "RateLimitError" ? 429 : 500);
    res.status(status).json({ error: err.message });
  }
};

const streamChat = async (req, res) => {
  const { rawText, plan, recentTrades, accounts, sessionId = "default", model } = req.body;

  // Headers SSE
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no"); // désactive le buffering nginx si présent
  res.flushHeaders();

  const send = (event, data) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    // 1. Historique persistant
    const persistentHistory = await aiMemoryService.getHistoryForGemini(sessionId);

    // 2. Sauvegarder message user
    await aiMemoryService.saveMessage({ sessionId, role: 'user', text: rawText, accounts: accounts || null });

    // 3. Stream Gemini → SSE
    let fullText = "";
    await geminiService.streamChatAnalysis({
      rawText, plan, recentTrades,
      history: persistentHistory,
      model,
      onChunk: (accumulatedText) => {
        fullText = accumulatedText;
        send("chunk", { text: accumulatedText });
      },
    });

    // 4. Sauvegarder réponse AI complète
    if (fullText) {
      await aiMemoryService.saveMessage({ sessionId, role: 'ai', text: fullText, accounts: accounts || null });
    }

    send("done", { text: fullText });
  } catch (err) {
    send("error", { message: err.message || "Erreur interne." });
  } finally {
    res.end();
  }
};

module.exports = {
  generateText,
  generateStructured,
  generateImage,
  generateChat,
  streamChat,
};
