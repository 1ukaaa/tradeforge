const { Router } = require("express");
const controller = require("../controllers/transaction.controller");

const router = Router();

// All transactions (global history view)
router.get("/", controller.getAllTransactions);

// Transactions for a specific investment
router.get("/:investmentId", controller.getTransactions);
router.post("/:investmentId", controller.addTransaction);
router.delete("/tx/:txId", controller.deleteTransaction);

module.exports = router;
