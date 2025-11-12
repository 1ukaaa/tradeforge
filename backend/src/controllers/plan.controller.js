// backend/src/controllers/plan.controller.js
const planService = require('../services/plan.service');

const getPlan = (req, res) => {
  try {
    const config = planService.getPlanConfig();
    res.json(config);
  } catch (err) {
    console.error("Erreur plan:", err);
    res.status(500).json({ error: "Impossible de charger le plan." });
  }
};

const updatePlan = (req, res) => {
  const { plan } = req.body;
  if (!plan || typeof plan !== "object") {
    return res.status(400).json({ error: "Plan manquant." });
  }
  try {
    const saved = planService.upsertPlanConfig(plan);
    res.json(saved);
  } catch (err) {
    console.error("Erreur plan:", err);
    res.status(500).json({ error: "Impossible d'enregistrer le plan." });
  }
};

module.exports = {
  getPlan,
  updatePlan,
};