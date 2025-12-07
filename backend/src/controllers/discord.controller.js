const axios = require("axios");
const journalService = require("../services/journal.service");
const { generateAnalysis } = require("../services/gemini.service");
const { getDiscordWebhookUrl, hasDiscordWebhookConfigured } = require("../config/discord.config");
const { sendToDiscord } = require("../services/discordSender.service");
const discordDraftsService = require("../services/discordDrafts.service");

const ALLOWED_VARIANTS = new Set(["trade.simple", "analysis.deep"]);
const VARIANT_COLORS = {
  "trade.simple": 0x4ade80,
  "analysis.deep": 0x60a5fa,
};

// --- HELPER FUNCTIONS (Context, Parsing) ---
const formatEntryContext = (entry) => {
  if (!entry) return "";
  const meta = entry.metadata || {};
  const blocks = [
    meta.title ? `Titre : ${meta.title}` : null,
    meta.symbol ? `Actif : ${meta.symbol}` : null,
    `Type : ${entry.type === "trade" ? "Trade" : "Analyse"}`,
    meta.timeframe ? `Timeframe : ${meta.timeframe}` : null,
    meta.result ? `Résultat : ${meta.result}` : null,
    meta.planSummary ? `Plan court : ${meta.planSummary}` : null,
    entry.plan ? `Plan détaillé : ${entry.plan}` : null,
    meta.outcome ? `Déroulé : ${meta.outcome}` : null,
    meta.nextSteps ? `Next steps : ${meta.nextSteps}` : null,
    meta.risk ? `Risque : ${meta.risk}` : null,
    Array.isArray(meta.tags) && meta.tags.length ? `Tags : ${meta.tags.join(", ")}` : null,
    entry.content ? `Analyse complète :\n${entry.content}` : null,
    entry.transcript ? `Transcript :\n${entry.transcript}` : null,
  ];
  return blocks.filter(Boolean).join("\n\n");
};

const extractJsonPayload = (text = "") => {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      return JSON.parse(match[0]);
    }
  }
  throw new Error("Réponse Gemini invalide (JSON introuvable).");
};

const sanitizeFields = (fields) => {
  if (!Array.isArray(fields)) return [];
  return fields
    .map((field) => ({
      name: field?.name ? String(field.name).trim().slice(0, 256) : null,
      value: field?.value ? String(field.value).trim().slice(0, 1024) : null,
      inline: Boolean(field?.inline),
    }))
    .filter((field) => field.name && field.value);
};

const sanitizeImageUrl = (value) => {
  if (!value) return null;
  const trimmed = String(value).trim();
  return trimmed;
};

const pickEntryImage = (entry) => {
  const images = entry?.metadata?.images;
  if (!Array.isArray(images) || !images.length) return null;
  const candidate = images.find((image) => image?.src);
  return candidate ? candidate.src : null;
};

const summarizeEntry = (entry) => ({
  id: entry.id,
  title: entry.metadata?.title || entry.content?.slice(0, 80) || `Entrée #${entry.id}`,
  type: entry.type,
  symbol: entry.metadata?.symbol || "",
  date: entry.metadata?.date || entry.createdAt,
});

const buildDiscordPayload = (entry, variant, data = {}) => {
  const fallbackTitle =
    data.title ||
    entry.metadata?.title ||
    `${entry.metadata?.symbol || "Analyse"} ${entry.metadata?.timeframe ? `• ${entry.metadata.timeframe}` : ""}`.trim();
  const fields = sanitizeFields(data.fields || []);
  const color = VARIANT_COLORS[variant] || 0x4b5563;

  const embed = {
    title: fallbackTitle,
    description: (data.description || entry.metadata?.planSummary || entry.content || "").trim(),
    color,
    fields: fields.slice(0, 6),
    timestamp: new Date().toISOString(),
  };

  if (data.footer) {
    embed.footer = { text: String(data.footer).trim().slice(0, 256) };
  } else if (entry.metadata?.timeframe) {
    embed.footer = { text: `Journal • ${entry.metadata.timeframe}` };
  }

  const imageUrl = sanitizeImageUrl(data.imageUrl) || pickEntryImage(entry);
  if (imageUrl) {
    embed.image = { url: imageUrl };
  }

  if (!embed.fields.length && entry.metadata?.planSummary) {
    embed.fields.push({
      name: "Plan",
      value: entry.metadata.planSummary,
      inline: false,
    });
  }

  return {
    content: (data.callToAction || "").trim(),
    embeds: [embed],
  };
};

// --- DRAFTS CRUD ---

const listDrafts = async (_req, res) => {
  try {
    const drafts = await discordDraftsService.listDrafts();
    res.json({ drafts });
  } catch (error) {
    console.error("Erreur listDrafts Discord :", error);
    res.status(500).json({ error: "Impossible de récupérer les brouillons Discord." });
  }
};

const getDraft = async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: "ID invalide" });
  try {
    const draft = await discordDraftsService.getDraftById(id);
    if (!draft) return res.status(404).json({ error: "Brouillon introuvable" });
    res.json({ draft });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createDraft = async (req, res) => {
  try {
    const draft = await discordDraftsService.createDraft(req.body || {});
    res.status(201).json({ draft });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateDraft = async (req, res) => {
  const id = Number(req.params.id);
  try {
    const draft = await discordDraftsService.updateDraft(id, req.body || {});
    res.json({ draft });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteDraft = async (req, res) => {
  const id = Number(req.params.id);
  try {
    const success = await discordDraftsService.deleteDraft(id);
    if (!success) return res.status(404).json({ error: "Brouillon introuvable" });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// --- GENERATION ---

const generateFromEntry = async (req, res) => {
  const entryId = Number(req.body?.entryId);
  const requestedVariant = req.body?.variant;
  const variant = ALLOWED_VARIANTS.has(requestedVariant) ? requestedVariant : "trade.simple";

  if (!entryId) {
    return res.status(400).json({ error: "Entrée du journal manquante." });
  }

  const entry = await journalService.getJournalEntryById(entryId);
  if (!entry) {
    return res.status(404).json({ error: "Entrée du journal introuvable." });
  }

  try {
    const rawText = formatEntryContext(entry);
    const aiResult = await generateAnalysis({
      rawText,
      plan: entry.plan || "",
      variant,
      template: `discord.${variant}`,
      type: "discord",
    });

    const parsed = extractJsonPayload(aiResult.result);
    // Note: We don't save draft yet, we just return generated content to user
    // The user will save it later via "Save" or "Publish"
    const payload = buildDiscordPayload(entry, variant, parsed);

    res.json({
      post: payload,
      entry: summarizeEntry(entry),
      raw: aiResult.result,
    });
  } catch (error) {
    console.error("Erreur génération Discord :", error);
    res.status(500).json({ error: error.message || "Impossible de générer le post Discord." });
  }
};

// --- PUBLICATION (Unified) ---

const publishPayload = async (req, res) => {
  const webhookUrl = getDiscordWebhookUrl();
  if (!webhookUrl) {
    return res.status(400).json({ error: "Aucun webhook Discord n'est configuré côté serveur." });
  }

  const { payload, scheduledAt, draftId, title, variant, metadata, entry_id } = req.body;

  if (!payload || typeof payload !== "object") {
    return res.status(400).json({ error: "Payload Discord manquant." });
  }

  try {
    // 1. Ensure Draft Exists (Persistence)
    let draft;
    const draftData = {
      title: title || "Post Discord",
      variant: variant || "trade.simple",
      payload,
      sourceEntryId: entry_id || null, // Ensure compatibility between entry_id and sourceEntryId
      metadata: metadata || {},
    };

    if (draftId) {
      draft = await discordDraftsService.updateDraft(draftId, draftData);
    } else {
      draft = await discordDraftsService.createDraft(draftData);
    }

    // 2. Logic: Schedule vs Immediate
    if (scheduledAt && new Date(scheduledAt) > new Date()) {
      // SCHEDULING
      console.log("[Discord] Planification du post pour", scheduledAt);

      const updated = await discordDraftsService.updateDraft(draft.id, {
        status: 'scheduled',
        scheduledAt,
      });

      return res.json({ success: true, scheduled: true, scheduledAt, draft: updated });

    } else {
      // IMMEDIATE SEND
      console.log("[Discord] Envoi immédiat (persisté)");

      const message = await sendToDiscord(webhookUrl, payload);
      console.log("[Discord] Message envoyé", { id: message?.id });

      const updated = await discordDraftsService.markSent(draft.id, {
        publishedAt: new Date().toISOString()
      });

      res.json({
        success: true,
        messageId: message?.id || null,
        draft: updated
      });
    }

  } catch (error) {
    const reason = error?.response?.data?.message || JSON.stringify(error?.response?.data) || error.message || "Échec de l'envoi Discord.";
    console.error("Discord publish error:", reason);
    res.status(500).json({ error: reason });
  }
};

const getDiscordStatus = (_req, res) => {
  res.json({
    configured: hasDiscordWebhookConfigured(),
  });
};

module.exports = {
  generateFromEntry,
  publishPayload,
  getDiscordStatus,
  listDrafts,
  getDraft,
  createDraft,
  updateDraft,
  deleteDraft,
};
