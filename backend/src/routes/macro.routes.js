// backend/src/routes/macro.routes.js
const { Router } = require('express');
const {
  getIndicatorsList,
  getAllIndicators,
  getIndicator,
  refreshIndicator,
} = require('../controllers/macro.controller');
const notesSvc = require('../services/macroNotes.service');
const twitterFeed = require('../services/twitterFeed.service');
const axios = require('axios');
const crypto = require('crypto');

// Cache traductions en mémoire (hash du texte → traduction)
const _translateCache = {};

const router = Router();

// GET  /api/macro/indicators         → liste des indicateurs (metadata)
router.get('/indicators', getIndicatorsList);

// GET  /api/macro/indicators/all     → toutes les données (optionnel: ?category=inflation)
router.get('/indicators/all', getAllIndicators);

// GET  /api/macro/indicators/:key    → données d'un indicateur (ex: /indicators/CPI)
router.get('/indicators/:key', getIndicator);

// POST /api/macro/indicators/:key/refresh → force refresh depuis FRED
router.post('/indicators/:key/refresh', refreshIndicator);

// ─── Notes CRUD ───────────────────────────────────────────────────────────────
router.get('/notes', async (req, res) => {
  try { res.json({ notes: await notesSvc.getAllNotes() }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});
router.post('/notes', async (req, res) => {
  try { res.status(201).json({ note: await notesSvc.createNote(req.body) }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});
router.put('/notes/:id', async (req, res) => {
  try { res.json({ note: await notesSvc.updateNote(req.params.id, req.body) }); }
  catch (e) { res.status(e.message.includes('introuvable') ? 404 : 500).json({ error: e.message }); }
});
router.delete('/notes/:id', async (req, res) => {
  try { await notesSvc.deleteNote(req.params.id); res.json({ ok: true }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/macro/feed?handle=deitaone → tweets d'un compte public
router.get('/feed', async (req, res) => {
  const handle = (req.query.handle || 'deitaone').replace('@', '').toLowerCase();
  try {
    const result = await twitterFeed.fetchTweets(handle, 30);
    res.json(result);
  } catch (e) {
    console.error('[MacroFeed]', e.message);
    res.status(500).json({ error: e.message, tweets: [], user: null });
  }
});

// POST /api/macro/feed/refresh?handle=deitaone → invalide le cache
router.post('/feed/refresh', async (req, res) => {
  const handle = (req.query.handle || req.body?.handle || 'deitaone').replace('@', '').toLowerCase();
  twitterFeed.invalidateCache(handle);
  try {
    const result = await twitterFeed.fetchTweets(handle, 30);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/macro/translate → traduit un texte en français via Gemini
router.post('/translate', async (req, res) => {
  const { text } = req.body;
  if (!text || typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ error: 'Texte manquant' });
  }

  const truncated = text.slice(0, 1000);
  const hash = crypto.createHash('md5').update(truncated).digest('hex');

  // Cache hit
  if (_translateCache[hash]) {
    return res.json({ translation: _translateCache[hash], fromCache: true });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(503).json({ error: 'GEMINI_API_KEY non configurée' });

  const prompt = `Traduis ce tweet financier Bloomberg en français. Ne traduis PAS les sigles, tickers, noms de pays, noms de personnalités, ni les termes techniques de marché (ex: SPX, CPI, NFP, Fed, OPEC, WTI, hawkish, dovish, etc.). Réponds UNIQUEMENT avec la traduction, sans guillemets ni explication.\n\nTweet: ${truncated}`;

  try {
    const model = process.env.GEMINI_TEXT_MODEL || 'gemini-2.0-flash-lite';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const { data } = await axios.post(url, {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 512, temperature: 0.2 },
    }, { timeout: 12000 });

    const translation = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!translation) throw new Error('Réponse Gemini vide');

    _translateCache[hash] = translation;
    res.json({ translation, fromCache: false });
  } catch (e) {
    const msg = e.response?.data?.error?.message || e.message;
    console.error('[MacroTranslate]', msg);
    res.status(500).json({ error: msg });
  }
});

module.exports = router;
