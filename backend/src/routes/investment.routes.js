const { Router } = require("express");
const controller = require("../controllers/investment.controller");

const router = Router();

router.get("/chart", controller.getPortfolioChartData);
router.get("/search", controller.searchAssets);
router.get("/", controller.getInvestments);
router.post("/", controller.addInvestment);
router.put("/:id", controller.updateInvestment);
router.delete("/:id", controller.deleteInvestment);

module.exports = router;
