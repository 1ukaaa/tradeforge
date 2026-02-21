// backend/src/controllers/journal.controller.js
const journalService = require('../services/journal.service');

const handleEntryServiceCall = async (res, serviceFn, ...args) => {
  try {
    const result = await serviceFn(...args);

    if (result === null) {
      return res.status(404).json({ error: "Entrée introuvable." });
    }
    res.json({ entry: result });
  } catch (err) {
    console.error("Erreur contrôleur journal (service):", err);
    res.status(500).json({ error: err.message || "Impossible de traiter la demande." });
  }
};

const getAllEntries = async (req, res) => {
  try {
    const entries = await journalService.getJournalEntries();
    res.json({ entries });
  } catch (err) {
    console.error("Erreur contrôleur journal (getAll):", err);
    res.status(500).json({ error: err.message || "Impossible de lister les entrées." });
  }
};

const createEntry = async (req, res) => {
  const { date, asset, direction, result, account, setup, images, trade_id } = req.body;

  await handleEntryServiceCall(res, journalService.insertJournalEntry, {
    date,
    asset,
    direction,
    result_outcome: result,
    account,
    setup,
    images,
    trade_id: trade_id || null
  });
};

const updateEntry = async (req, res) => {
  const { id } = req.params;
  const { date, asset, direction, result, account, setup, images, trade_id } = req.body;

  await handleEntryServiceCall(res, journalService.updateJournalEntry, {
    id: Number(id),
    date,
    asset,
    direction,
    result_outcome: result,
    account,
    setup,
    images,
    trade_id: trade_id || null
  });
};

const deleteEntry = async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await journalService.deleteJournalEntry(Number(id));
    if (!deleted) {
      return res.status(404).json({ error: "Entrée introuvable." });
    }
    res.status(204).end();
  } catch (err) {
    console.error("Erreur contrôleur journal (delete):", err);
    res.status(500).json({ error: err.message || "Impossible de supprimer l'entrée." });
  }
};

module.exports = {
  getAllEntries,
  createEntry,
  updateEntry,
  deleteEntry,
};