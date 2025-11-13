// backend/src/controllers/economic.controller.js
const economicService = require("../services/economic.service");

const getEvents = async (req, res) => {
  try {
    const events = await economicService.getEconomicEvents();
    res.json({ events });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getEvents,
};