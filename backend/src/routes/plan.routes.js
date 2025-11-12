// backend/src/routes/plan.routes.js
const { Router } = require('express');
const { getPlan, updatePlan } = require('../controllers/plan.controller');

const router = Router();

router.get('/', getPlan);
router.put('/', updatePlan);

module.exports = router;