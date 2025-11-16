// backend/src/routes/twitter.routes.js
const { Router } = require("express");
const {
  listDrafts,
  getDraft,
  createDraft,
  updateDraft,
  deleteDraft,
  publishDraft,
  generateFromEntry,
} = require("../controllers/twitter.controller");

const twitterRouter = Router();

twitterRouter.get("/drafts", listDrafts);
twitterRouter.get("/drafts/:id", getDraft);
twitterRouter.post("/drafts", createDraft);
twitterRouter.put("/drafts/:id", updateDraft);
twitterRouter.delete("/drafts/:id", deleteDraft);
twitterRouter.post("/drafts/:id/publish", publishDraft);
twitterRouter.post("/generate", generateFromEntry);

module.exports = twitterRouter;
