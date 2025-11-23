const planService = require('../services/plan.service');

const getPlan = async (req, res) => {
  try {
    const plan = await planService.getPlan();
    res.json(plan);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lecture plan" });
  }
};

const updatePlan = async (req, res) => {
  try {
    const plan = await planService.updatePlan(req.body);
    res.json(plan);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur mise à jour plan" });
  }
};

module.exports = { getPlan, updatePlan };