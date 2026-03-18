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

module.exports = router;
