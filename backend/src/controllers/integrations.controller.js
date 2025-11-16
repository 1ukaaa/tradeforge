// backend/src/controllers/integrations.controller.js
const { getIntegrations } = require("../services/integrations.service");

const listIntegrations = (_req, res) => {
  try {
    const integrations = getIntegrations();
    res.json(integrations);
  } catch (error) {
    console.error("Erreur récupération intégrations :", error);
    res.status(500).json({ error: "Impossible de récupérer les intégrations." });
  }
};

module.exports = {
  listIntegrations,
};
