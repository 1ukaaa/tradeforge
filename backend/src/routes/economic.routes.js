const { Router } = require("express");
const { getEvents } = require("../controllers/economic.controller");

const router = Router();

router.get("/", getEvents);

module.exports = router;
