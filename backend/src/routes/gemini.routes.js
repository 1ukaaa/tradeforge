// backend/src/routes/gemini.routes.js
const { Router } = require('express');
const { generateText, generateStructured, generateImage } = require('../controllers/gemini.controller');

const router = Router();

router.post('/', generateText);
router.post('/structured', generateStructured);
router.post('/image', generateImage);

module.exports = router;
