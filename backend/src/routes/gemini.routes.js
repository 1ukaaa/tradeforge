// backend/src/routes/gemini.routes.js
const { Router } = require('express');
const { generateText, generateStructured, generateImage, generateChat, streamChat } = require('../controllers/gemini.controller');

const router = Router();

router.post('/', generateText);
router.post('/structured', generateStructured);
router.post('/image', generateImage);
router.post('/chat', generateChat);
router.post('/chat/stream', streamChat);

module.exports = router;
