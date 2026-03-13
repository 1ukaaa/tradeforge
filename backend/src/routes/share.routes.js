// backend/src/routes/share.routes.js
const { Router } = require("express");
const {
  createLink,
  listLinks,
  deleteLink,
  revokeLink,
  checkToken,
  authenticate,
  getSharedJournal,
} = require("../controllers/share.controller");

const router = Router();

// ─── Routes propriétaire (gestion des liens) ───────────────────
router.get("/", listLinks);
router.post("/", createLink);
router.delete("/:id", deleteLink);
router.patch("/:id/revoke", revokeLink);

module.exports = router;

// ─── Routes publiques (accès partagé) ───────────────────────────
const publicRouter = Router();
const rateLimit = require("express-rate-limit");

// Limiter strict pour empêcher le bruteforce du PIN (5 essais max / 15 minutes)
const pinAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: "Trop de tentatives de PIN échouées. Réessayez dans 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

publicRouter.get("/:token/check", checkToken);
publicRouter.post("/:token/auth", pinAuthLimiter, authenticate);
publicRouter.post("/:token/journal", getSharedJournal);

module.exports.publicRouter = publicRouter;
module.exports.shareRouter = router;
