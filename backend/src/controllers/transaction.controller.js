const transactionService = require("../services/transaction.service");

async function getTransactions(req, res) {
    try {
        const data = await transactionService.getTransactions(req.params.investmentId);
        res.json(data);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur lors de la récupération des transactions" });
    }
}

async function getAllTransactions(req, res) {
    try {
        const data = await transactionService.getAllTransactions();
        res.json(data);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur lors de la récupération des transactions" });
    }
}

async function addTransaction(req, res) {
    try {
        const data = await transactionService.addTransaction(req.params.investmentId, req.body);
        res.json(data);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur lors de l'ajout de la transaction" });
    }
}

async function deleteTransaction(req, res) {
    try {
        const data = await transactionService.deleteTransaction(req.params.txId);
        res.json(data);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur lors de la suppression de la transaction" });
    }
}

module.exports = { getTransactions, getAllTransactions, addTransaction, deleteTransaction };
