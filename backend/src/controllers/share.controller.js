// backend/src/controllers/share.controller.js
const shareService = require("../services/share.service");
const journalService = require("../services/journal.service");

// ─── Routes propriétaire (protégées par le fait d'être sur l'app) ───

/**
 * POST /api/share — Créer un lien de partage
 * Body: { pin: string, label?: string }
 */
const createLink = async (req, res) => {
  try {
    const { pin, label } = req.body;
    if (!pin || String(pin).length < 4) {
      return res
        .status(400)
        .json({ error: "Le PIN doit faire au moins 4 caractères." });
    }
    const link = await shareService.createShareLink({ pin: String(pin), label });
    res.status(201).json({ link });
  } catch (err) {
    console.error("Erreur createLink:", err);
    res.status(500).json({ error: "Impossible de créer le lien de partage." });
  }
};

/**
 * GET /api/share — Lister les liens de partage
 */
const listLinks = async (_req, res) => {
  try {
    const links = await shareService.listShareLinks();
    res.json({ links });
  } catch (err) {
    console.error("Erreur listLinks:", err);
    res.status(500).json({ error: "Impossible de lister les liens." });
  }
};

/**
 * DELETE /api/share/:id — Supprimer un lien
 */
const deleteLink = async (req, res) => {
  try {
    const deleted = await shareService.deleteShareLink(Number(req.params.id));
    if (!deleted) return res.status(404).json({ error: "Lien introuvable." });
    res.status(204).end();
  } catch (err) {
    console.error("Erreur deleteLink:", err);
    res.status(500).json({ error: "Impossible de supprimer le lien." });
  }
};

/**
 * PATCH /api/share/:id/revoke — Révoquer un lien
 */
const revokeLink = async (req, res) => {
  try {
    const revoked = await shareService.revokeShareLink(Number(req.params.id));
    if (!revoked) return res.status(404).json({ error: "Lien introuvable." });
    res.json({ success: true });
  } catch (err) {
    console.error("Erreur revokeLink:", err);
    res.status(500).json({ error: "Impossible de révoquer le lien." });
  }
};

// ─── Routes publiques (accès partagé) ───────────────────────────────

/**
 * GET /api/shared/:token/check — Vérifier si le token existe (pour afficher le formulaire PIN)
 */
const checkToken = async (req, res) => {
  try {
    const info = await shareService.tokenExists(req.params.token);
    if (!info.exists) {
      return res.status(404).json({ error: "Lien de partage introuvable." });
    }
    if (!info.active) {
      return res.status(410).json({ error: "Ce lien de partage a été révoqué." });
    }
    res.json({ valid: true, label: info.label });
  } catch (err) {
    console.error("Erreur checkToken:", err);
    res.status(500).json({ error: "Erreur serveur." });
  }
};

/**
 * POST /api/shared/:token/auth — Authentifier avec le PIN
 * Body: { pin: string }
 */
const authenticate = async (req, res) => {
  try {
    const { pin } = req.body;
    if (!pin) {
      return res.status(400).json({ error: "PIN requis." });
    }
    const result = await shareService.validateAccess(
      req.params.token,
      String(pin)
    );
    if (!result.valid) {
      const messages = {
        not_found: "Lien de partage introuvable.",
        revoked: "Ce lien de partage a été révoqué.",
        wrong_pin: "PIN incorrect.",
      };
      const status = result.reason === "wrong_pin" ? 401 : 404;
      return res.status(status).json({ error: messages[result.reason] });
    }
    res.json({ authenticated: true });
  } catch (err) {
    console.error("Erreur authenticate:", err);
    res.status(500).json({ error: "Erreur serveur." });
  }
};

/**
 * POST /api/shared/:token/journal — Récupérer le journal (lecture seule)
 * Body: { pin: string }
 */
const getSharedJournal = async (req, res) => {
  try {
    const { pin } = req.body;
    if (!pin) {
      return res.status(400).json({ error: "PIN requis." });
    }
    const result = await shareService.validateAccess(
      req.params.token,
      String(pin)
    );
    if (!result.valid) {
      return res.status(401).json({ error: "Accès non autorisé." });
    }

    const entries = await journalService.getJournalEntries();
    res.json({ entries });
  } catch (err) {
    console.error("Erreur getSharedJournal:", err);
    res.status(500).json({ error: "Erreur serveur." });
  }
};

module.exports = {
  createLink,
  listLinks,
  deleteLink,
  revokeLink,
  checkToken,
  authenticate,
  getSharedJournal,
};
