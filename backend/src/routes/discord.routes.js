const { Router } = require("express");
const { generateFromEntry, publishPayload, getDiscordStatus } = require("../controllers/discord.controller");

const router = Router();

router.post("/generate", generateFromEntry);
router.post("/publish", publishPayload);
router.get("/status", getDiscordStatus);

module.exports = router;
