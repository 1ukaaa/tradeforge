const investmentService = require("../services/investment.service");

async function getInvestments(req, res) {
    try {
        const data = await investmentService.getAllInvestments();
        res.json(data);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur lors de la récupération des investissements" });
    }
}

async function addInvestment(req, res) {
    try {
        const data = await investmentService.addInvestment(req.body);
        res.json(data);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur lors de l'ajout" });
    }
}

async function updateInvestment(req, res) {
    try {
        const data = await investmentService.updateInvestment(req.params.id, req.body);
        res.json(data);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur lors de la mise à jour" });
    }
}

async function deleteInvestment(req, res) {
    try {
        const data = await investmentService.deleteInvestment(req.params.id);
        res.json(data);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur lors de la suppression" });
    }
}

async function getPortfolioChartData(req, res) {
    try {
        const period = req.query.period || '1y';
        const data = await investmentService.getPortfolioChartData(period);
        res.json(data);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur lors de la récupération des données du graphique" });
    }
}

module.exports = {
    getInvestments,
    addInvestment,
    updateInvestment,
    deleteInvestment,
    getPortfolioChartData
};
