// backend/src/controllers/broker.controller.js
const brokerService = require("../services/broker.service");

const getBrokerSummary = (req, res) => {
  try {
    const summary = brokerService.getDashboardSummary();
    res.json(summary);
  } catch (error) {
    console.error("Erreur broker summary:", error);
    res.status(500).json({ error: "Impossible de récupérer le dashboard broker." });
  }
};

const getBrokerAccounts = (req, res) => {
  try {
    const accounts = brokerService.getBrokerAccounts();
    res.json({ accounts });
  } catch (error) {
    console.error("Erreur broker accounts:", error);
    res.status(500).json({ error: "Impossible de récupérer les comptes broker." });
  }
};

const getBrokerTrades = (req, res) => {
  try {
    const accountId = req.query.accountId ? Number(req.query.accountId) : null;
    const limit = req.query.limit ? Number(req.query.limit) : null;
    const trades = brokerService.getBrokerTrades({ accountId, limit });
    res.json({ trades });
  } catch (error) {
    console.error("Erreur broker trades:", error);
    res.status(500).json({ error: "Impossible de récupérer les trades broker." });
  }
};

const getBrokerPositions = (req, res) => {
  try {
    const accountId = req.query.accountId ? Number(req.query.accountId) : null;
    const order =
      typeof req.query.order === "string" && req.query.order.toLowerCase() === "asc"
        ? "asc"
        : "desc";
    const positions = brokerService.getBrokerPositions({ accountId, order });
    res.json({ positions });
  } catch (error) {
    console.error("Erreur broker positions:", error);
    res.status(500).json({ error: "Impossible de récupérer les positions broker." });
  }
};

const createBrokerAccount = (req, res) => {
  const { type } = req.body || {};
  if (!type) {
    return res.status(400).json({ error: "Type d'intégration requis." });
  }
  try {
    let account;
    if (type === "mt5") {
      const { name, currency, color, initialBalance, login, password, server } = req.body;
      account = brokerService.createMt5Account({
        name,
        currency,
        color,
        initialBalance,
        login,
        password,
        server,
      });
    } else if (type === "hyperliquid") {
      const { name, currency, color, initialBalance, address } = req.body;
      account = brokerService.createHyperliquidAccount({
        name,
        currency,
        color,
        initialBalance,
        address,
      });
    } else {
      return res.status(400).json({ error: "Type d'intégration non supporté." });
    }
    res.status(201).json({ account });
  } catch (error) {
    console.error("Erreur création compte broker:", error);
    res.status(500).json({ error: error.message || "Impossible de créer le compte." });
  }
};

const syncBrokerAccount = async (req, res) => {
  const { id } = req.params;
  try {
    const { account, tradesCount, retrievedCount } = await brokerService.syncBrokerAccount(Number(id));
    res.json({ account, tradesCount, retrievedCount });
  } catch (error) {
    console.error("Erreur synchronisation compte broker:", error);
    res.status(500).json({ error: error.message || "Impossible de synchroniser le compte." });
  }
};

const importBrokerCsv = async (req, res) => {
  const { id } = req.params;
  if (!req.file) {
    return res.status(400).json({ error: "Fichier CSV requis pour l'import." });
  }
  try {
    const { account, tradesCount, retrievedCount } = await brokerService.importBrokerCsv(
      Number(id),
      req.file
    );
    res.json({ account, tradesCount, retrievedCount });
  } catch (error) {
    console.error("Erreur import CSV broker:", error);
    res.status(500).json({ error: error.message || "Impossible d'importer le CSV." });
  }
};

module.exports = {
  getBrokerSummary,
  getBrokerAccounts,
  getBrokerTrades,
  getBrokerPositions,
  createBrokerAccount,
  syncBrokerAccount,
  importBrokerCsv,
};
