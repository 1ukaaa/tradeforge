// backend/src/controllers/journal.controller.js
const journalService = require('../services/journal.service');

// Ce helper est pour createEntry et updateEntry
// Il renvoie { entry: ... } comme l'ancien code
const handleEntryServiceCall = (res, serviceFn, ...args) => {
  try {
    // Note: on n'utilise pas 'await' car les fonctions de service BDD sont synchrones
    const result = serviceFn(...args);
    if (result === null) {
      return res.status(404).json({ error: "Entrée introuvable." });
    }
    // On encapsule la réponse dans { entry: ... }
    res.json({ entry: result });
  } catch (err) { // <-- LA CORRECTION EST ICI (ajout du ')')
    console.error("Erreur contrôleur journal (service):", err);
    res.status(500).json({ error: err.message || "Impossible de traiter la demande." });
  }
};

// ---
// Cette route a une forme de réponse spécifique { entries: [...] }
// On n'utilise pas de helper générique.
const getAllEntries = (req, res) => {
  try {
    const entries = journalService.getJournalEntries();
    // On respecte le contrat de l'API d'origine en renvoyant { entries: ... }
    res.json({ entries }); 
  } catch (err) {
    console.error("Erreur contrôleur journal (getAll):", err);
    res.status(500).json({ error: err.message || "Impossible de lister les entrées." });
  }
};

const createEntry = (req, res) => {
  const { type, content, plan, transcript, metadata } = req.body;
  if (!content || typeof content !== "string") {
    return res.status(400).json({ error: "Contenu de l'entrée manquant." });
  }
  const normalizedType = type === "trade" ? "trade" : "analyse";
  
  handleEntryServiceCall(res, journalService.insertJournalEntry, {
    type: normalizedType,
    content,
    plan,
    transcript,
    metadata,
  });
};

const updateEntry = (req, res) => {
  const { id } = req.params;
  const { type, content, plan, transcript, metadata } = req.body;
  
  if (!content || typeof content !== "string") {
    return res.status(400).json({ error: "Contenu de l'entrée manquant." });
  }
  const normalizedType = type === "trade" ? "trade" : "analyse";
  
  handleEntryServiceCall(res, journalService.updateJournalEntry, {
    id: Number(id),
    type: normalizedType,
    content,
    plan,
    transcript,
    metadata,
  });
};

const deleteEntry = (req, res) => {
  const { id } = req.params;
  try {
    const deleted = journalService.deleteJournalEntry(Number(id));
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