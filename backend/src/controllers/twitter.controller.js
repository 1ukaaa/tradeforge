// backend/src/controllers/twitter.controller.js
const twitterDraftsService = require("../services/twitterDrafts.service");
const { publishThread } = require("../services/twitterPublisher.service");
const journalService = require("../services/journal.service");
const { generateAnalysis } = require("../services/gemini.service");
const { enforceRateLimit } = require("../core/rateLimiter");

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

const createTweetId = (index) => `tweet-${Date.now()}-${index}`;

const parseGeneratedTweets = (rawText = "") => {
  const lines = rawText.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const tweets = [];
  let buffer = null;

  const pushBuffer = () => {
    if (buffer && buffer.text.trim()) {
      tweets.push({
        id: buffer.id,
        text: buffer.text.trim(),
        media: [],
      });
    }
    buffer = null;
  };

  lines.forEach((line) => {
    const match = line.match(/^tweet(?:\s+\d+)?\s*[-—:]\s*(.+)$/i);
    if (match) {
      pushBuffer();
      tweets.push({
        id: createTweetId(tweets.length),
        text: match[1].trim(),
        media: [],
      });
    } else if (buffer) {
      buffer.text += ` ${line}`;
    } else {
      buffer = {
        id: createTweetId(tweets.length),
        text: line,
      };
    }
  });

  pushBuffer();

  if (!tweets.length && rawText.trim()) {
    tweets.push({
      id: createTweetId(0),
      text: rawText.trim(),
      media: [],
    });
  }

  return tweets;
};

const listDrafts = async (_req, res) => {
  try {
    const drafts = await twitterDraftsService.listDrafts();
    res.json({ drafts });
  } catch (error) {
    console.error("Erreur listDrafts :", error);
    res.status(500).json({ error: "Impossible de récupérer les brouillons." });
  }
};

const getDraft = async (req, res) => {
  const id = Number(req.params.id);
  if (!id) {
    return res.status(400).json({ error: "Identifiant invalide." });
  }
  try {
    const draft = await twitterDraftsService.getDraftById(id);
    if (!draft) {
      return res.status(404).json({ error: "Brouillon introuvable." });
    }
    res.json({ draft });
  } catch (error) {
    console.error("Erreur getDraft :", error);
    res.status(500).json({ error: "Impossible de récupérer le brouillon." });
  }
};

const createDraft = async (req, res) => {
  try {
    const draft = await twitterDraftsService.createDraft(req.body || {});
    res.status(201).json({ draft });
  } catch (error) {
    console.error("Erreur createDraft :", error);
    res.status(500).json({ error: "Impossible de créer le brouillon." });
  }
};

const updateDraft = async (req, res) => {
  const id = Number(req.params.id);
  if (!id) {
    return res.status(400).json({ error: "Identifiant invalide." });
  }
  try {
    const draft = await twitterDraftsService.updateDraft(id, req.body || {});
    res.json({ draft });
  } catch (error) {
    console.error("Erreur updateDraft :", error);
    res.status(500).json({ error: "Impossible de mettre à jour le brouillon." });
  }
};

const deleteDraft = async (req, res) => {
  const id = Number(req.params.id);
  if (!id) {
    return res.status(400).json({ error: "Identifiant invalide." });
  }
  try {
    const deleted = await twitterDraftsService.deleteDraft(id);
    if (!deleted) {
      return res.status(404).json({ error: "Brouillon introuvable." });
    }
    res.json({ success: true });
  } catch (error) {
    console.error("Erreur deleteDraft :", error);
    res.status(500).json({ error: "Impossible de supprimer le brouillon." });
  }
};

const publishDraft = async (req, res) => {
  const id = Number(req.params.id);
  if (!id) {
    return res.status(400).json({ error: "Identifiant invalide." });
  }
  try {
    const draft = await twitterDraftsService.getDraftById(id);
    if (!draft) {
      return res.status(404).json({ error: "Brouillon introuvable." });
    }
    // Rate limit : 10/jour et 50/semaine pour la publication Twitter
    enforceRateLimit("twitter:publish:day", {
      windowMs: 24 * 60 * 60 * 1000,
      max: 10,
      message: "Quota Twitter atteint : 10 publications par jour.",
    });
    enforceRateLimit("twitter:publish:week", {
      windowMs: 7 * 24 * 60 * 60 * 1000,
      max: 50,
      message: "Quota Twitter atteint : 50 publications par semaine.",
    });

    const publishResult = await publishThread(draft.payload);
    const publishedAt = new Date().toISOString();
    const updatedDraft = await twitterDraftsService.markPublished(id, {
      tweetId: publishResult.firstTweetId,
      publishedAt,
    });
    res.json({
      draft: updatedDraft,
      publishResult,
    });
  } catch (error) {
    console.error("Erreur publishDraft :", error);
    const status = error?.status || (error?.name === "RateLimitError" ? 429 : 500);
    res.status(status).json({ error: error.message || "Publication impossible." });
  }
};

const generateFromEntry = async (req, res) => {
  const entryId = Number(req.body?.entryId);
  const variant = req.body?.variant || "tweet.simple";
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
      template: `twitter.${variant}`,
      type: "twitter",
    });
    const tweets = parseGeneratedTweets(aiResult.result);
    if (!tweets.length) {
      throw new Error("Gemini n'a pas renvoyé de contenu exploitable.");
    }
    res.json({
      tweets,
      raw: aiResult.result,
    });
  } catch (error) {
    console.error("Erreur génération Twitter :", error);
    res.status(500).json({ error: error.message || "Impossible de générer le thread." });
  }
};

module.exports = {
  listDrafts,
  getDraft,
  createDraft,
  updateDraft,
  deleteDraft,
  publishDraft,
  generateFromEntry,
};
