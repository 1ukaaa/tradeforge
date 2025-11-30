const axios = require("axios");
const FormData = require("form-data"); // Nécessaire pour l'envoi de fichiers
const journalService = require("../services/journal.service");
const { generateAnalysis } = require("../services/gemini.service");
const { getDiscordWebhookUrl, hasDiscordWebhookConfigured } = require("../config/discord.config");

const ALLOWED_VARIANTS = new Set(["trade.simple", "analysis.deep"]);
const VARIANT_COLORS = {
  "trade.simple": 0x4ade80,
  "analysis.deep": 0x60a5fa,
};

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

const isValidHttpUrl = (value = "") => /^https?:\/\//i.test(value.trim());

const sanitizeImageUrl = (value) => {
  if (!value) return null;
  const trimmed = String(value).trim();
  // On autorise tout ici, le traitement DataURI se fait à l'envoi
  return trimmed;
};

const pickEntryImage = (entry) => {
  const images = entry?.metadata?.images;
  if (!Array.isArray(images) || !images.length) return null;
  // On prend la première image valide (http ou data)
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

  // On récupère l'image, qu'elle soit HTTP ou DataURI
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

// --- LOGIQUE D'ENVOI AVEC GESTION DES IMAGES LOCALES ---
const publishPayload = async (req, res) => {
  const webhookUrl = getDiscordWebhookUrl();
  if (!webhookUrl) {
    return res.status(400).json({ error: "Aucun webhook Discord n'est configuré côté serveur." });
  }

  let payload = req.body?.payload;
  const scheduledAt = req.body?.scheduledAt;

  if (!payload || typeof payload !== "object") {
    return res.status(400).json({ error: "Payload Discord manquant." });
  }

  try {
    // 1. GESTION PLANIFICATION
    if (scheduledAt && new Date(scheduledAt) > new Date()) {
      console.log("[Discord] Planification du post pour", scheduledAt);
      await discordQueue.addToQueue(payload, scheduledAt);
      return res.json({ success: true, scheduled: true, scheduledAt });
    }

    // 2. ENVOI DIRECT
    console.log("[Discord] Envoi immédiat");
    const message = await sendToDiscord(webhookUrl, payload);
    console.log("[Discord] Message envoyé", { id: message?.id });

    res.json({
      success: true,
      messageId: message?.id || null,
      channelId: message?.channel_id || null,
      timestamp: message?.timestamp || null,
    });

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
};
