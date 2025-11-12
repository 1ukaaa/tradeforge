// backend/src/routes/journal.routes.js
const { Router } = require('express');
const { 
  getAllEntries, 
  createEntry, 
  updateEntry, 
  deleteEntry 
} = require('../controllers/journal.controller');

const router = Router();

router.get('/', getAllEntries);
router.post('/', createEntry);
router.put('/:id', updateEntry);
router.delete('/:id', deleteEntry);

module.exports = router;