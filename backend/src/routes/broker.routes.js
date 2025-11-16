// backend/src/routes/broker.routes.js
const { Router } = require('express');
const brokerController = require('../controllers/broker.controller');

const router = Router();

router.get('/summary', brokerController.getBrokerSummary);
router.get('/accounts', brokerController.getBrokerAccounts);
router.get('/trades', brokerController.getBrokerTrades);
router.get('/positions', brokerController.getBrokerPositions);
router.post('/accounts', brokerController.createBrokerAccount);
router.post('/accounts/:id/sync', brokerController.syncBrokerAccount);

module.exports = router;
