const { Router } = require("express");
const {
    generateFromEntry,
    publishPayload,
    getDiscordStatus,
    listDrafts,
    getDraft,
    createDraft,
    updateDraft,
    deleteDraft
} = require("../controllers/discord.controller");

const router = Router();

// Generation & Action
router.post("/generate", generateFromEntry);
router.post("/publish", publishPayload);
router.get("/status", getDiscordStatus);

// CRUD Drafts
router.get("/drafts", listDrafts);
router.post("/drafts", createDraft);
router.get("/drafts/:id", getDraft);
router.patch("/drafts/:id", updateDraft);
router.delete("/drafts/:id", deleteDraft);

module.exports = router;
