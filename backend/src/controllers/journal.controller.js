// backend/src/controllers/journal.controller.js
const journalService = require('../services/journal.service');

// Helper mis à jour pour gérer l'async/await
const handleEntryServiceCall = async (res, serviceFn, ...args) => {
  try {
    // AJOUT CRUCIAL : await
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

const getAllEntries = async (req, res) => { // <-- Ajout de async
  try {
    // AJOUT CRUCIAL : await
    const entries = await journalService.getJournalEntries();
    res.json({ entries }); 
  } catch (err) {
    console.error("Erreur contrôleur journal (getAll):", err);
    res.status(500).json({ error: err.message || "Impossible de lister les entrées." });
  }
};

const createEntry = async (req, res) => { // <-- Ajout de async
  const { type, content, plan, transcript, metadata } = req.body;
  if (!content || typeof content !== "string") {
    return res.status(400).json({ error: "Contenu de l'entrée manquant." });
  }
  const normalizedType = type === "trade" ? "trade" : "analyse";
  
  // On passe await devant le helper
  await handleEntryServiceCall(res, journalService.insertJournalEntry, {
    type: normalizedType,
    content,
    plan,
    transcript,
    metadata,
  });
};

const updateEntry = async (req, res) => { // <-- Ajout de async
  const { id } = req.params;
  const { type, content, plan, transcript, metadata } = req.body;
  
  if (!content || typeof content !== "string") {
    return res.status(400).json({ error: "Contenu de l'entrée manquant." });
  }
  const normalizedType = type === "trade" ? "trade" : "analyse";
  
  await handleEntryServiceCall(res, journalService.updateJournalEntry, {
    id: Number(id),
    type: normalizedType,
    content,
    plan,
    transcript,
    metadata,
  });
};

const deleteEntry = async (req, res) => { // <-- Ajout de async
  const { id } = req.params;
  try {
    const deleted = await journalService.deleteJournalEntry(Number(id)); // <-- Ajout de await
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