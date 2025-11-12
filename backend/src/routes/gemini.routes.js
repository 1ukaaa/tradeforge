// backend/src/routes/gemini.routes.js
const { Router } = require('express');
const { generateText, generateStructured } = require('../controllers/gemini.controller');

const router = Router();

router.post('/', generateText);
router.post('/structured', generateStructured);

module.exports = router;