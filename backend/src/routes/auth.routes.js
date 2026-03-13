// backend/src/routes/auth.routes.js
const { Router } = require("express");
const crypto = require("crypto");
const rateLimit = require("express-rate-limit");

const router = Router();

// Rate limiter strict pour l'authentification : 10 tentatives max / 15 mins
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Trop de tentatives de connexion échouées. Réessayez dans 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * POST /api/auth/verify
 * Body: { password: string }
 * 
 * Vérifie le mot de passe maître de l'application.
 * Le mot de passe est défini via la variable d'env APP_PASSWORD.
 * Si APP_PASSWORD n'est pas défini, l'auth est désactivée (accès libre).
 */
router.post("/verify", authLimiter, (req, res) => {
  const appPassword = process.env.APP_PASSWORD;

  // Si aucun mot de passe configuré, accès libre
  if (!appPassword) {
    return res.json({ authenticated: true, message: "Aucune authentification configurée." });
  }

  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ error: "Mot de passe requis." });
  }

  // Comparaison en temps constant pour éviter les timing attacks
  const inputHash = crypto.createHash("sha256").update(String(password)).digest("hex");
  const expectedHash = crypto.createHash("sha256").update(String(appPassword)).digest("hex");

  if (crypto.timingSafeEqual(Buffer.from(inputHash), Buffer.from(expectedHash))) {
    return res.json({ authenticated: true });
  }

  return res.status(401).json({ error: "Mot de passe incorrect." });
});

/**
 * GET /api/auth/status
 * 
 * Vérifie si l'authentification est activée (APP_PASSWORD défini).
 */
router.get("/status", (_req, res) => {
  const isEnabled = !!process.env.APP_PASSWORD;
  res.json({ authRequired: isEnabled });
});

module.exports = router;
