// backend/src/services/twitterDrafts.service.js
const db = require("../core/database");
const { parseMetadata, serializeMetadata } = require("../core/utils");

const ensureArray = (value) => (Array.isArray(value) ? value : []);

const normalizeTweet = (tweet = {}, index = 0, seed = Date.now()) => {
  const normalizedMedia = ensureArray(tweet.media)
    .map((media, mediaIndex) => normalizeAttachment(media, `${seed}-${index}-${mediaIndex}`))
    .filter(Boolean);
  return {
    id: tweet.id || `tweet-${seed}-${index + 1}`,
    text: typeof tweet.text === "string" ? tweet.text : "",
    media: normalizedMedia,
  };
};

const normalizeAttachment = (attachment = {}, index = 0, seed = Date.now()) => {
  if (typeof attachment === "string") {
    return { id: `attachment-${seed}-${index + 1}`, src: attachment, caption: "" };
  }
  const src = typeof attachment.src === "string" ? attachment.src : "";
  if (!src) return null;
  return {
    id: attachment.id || `attachment-${seed}-${index + 1}`,
    src,
    caption: attachment.caption || "",
  };
};

const normalizePayload = (payload = {}) => {
  const source = typeof payload === "object" && payload !== null ? payload : {};
  const seed = Date.now();
  let tweets = ensureArray(source.tweets).map((tweet, index) => normalizeTweet(tweet, index, seed));
  if (!tweets.length) {
    tweets = [normalizeTweet({}, 0, seed)];
  }
  const legacyAttachments = ensureArray(source.attachments)
    .map((attachment, index) => normalizeAttachment(attachment, index, seed))
    .filter(Boolean);
  if (legacyAttachments.length && tweets[0] && (!tweets[0].media || !tweets[0].media.length)) {
    tweets[0] = { ...tweets[0], media: legacyAttachments };
  }
  return {
    tweets,
    attachments: [],
    notes: typeof source.notes === "string" ? source.notes : "",
  };
};

const parsePayload = (payload) => {
  try {
    const parsed = payload ? JSON.parse(payload) : {};
    return normalizePayload(parsed);
  } catch {
    return normalizePayload();
  }
};

const getTimestamp = () => new Date().toISOString();

const mapDraftRow = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title || "",
    variant: row.variant || "tweet.simple",
    status: row.status || "draft",
    payload: parsePayload(row.payload),
    sourceEntryId: row.sourceEntryId,
    metadata: parseMetadata(row.metadata),
    publishedTweetId: row.publishedTweetId || null,
    publishedAt: row.publishedAt || null,
    scheduledAt: row.scheduledAt || null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
};

const listDrafts = async () => {
  const result = await db.execute("SELECT * FROM twitter_drafts ORDER BY datetime(updatedAt) DESC");
  return result.rows.map(mapDraftRow);
};

const getDraftById = async (id) => {
  const result = await db.execute({
    sql: "SELECT * FROM twitter_drafts WHERE id = ?",
    args: [id],
  });
  return mapDraftRow(result.rows[0]);
};

const getDueDrafts = async () => {
  const now = new Date().toISOString();
  const result = await db.execute({
    sql: "SELECT * FROM twitter_drafts WHERE status = 'scheduled' AND scheduledAt <= ?",
    args: [now],
  });
  return result.rows.map(mapDraftRow);
};

const createDraft = async ({
  title = "",
  variant = "tweet.simple",
  status = "draft",
  payload = {},
  sourceEntryId = null,
  metadata = {},
  scheduledAt = null,
} = {}) => {
  const normalizedPayload = normalizePayload(payload);
  const serializedPayload = JSON.stringify(normalizedPayload);
  const serializedMetadata = serializeMetadata(metadata);
  const timestamp = getTimestamp();
  const result = await db.execute({
    sql: `
      INSERT INTO twitter_drafts(title, variant, status, payload, sourceEntryId, metadata, scheduledAt, createdAt, updatedAt)
      VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    args: [
      title,
      variant,
      status,
      serializedPayload,
      sourceEntryId,
      serializedMetadata,
      scheduledAt, // Use the scheduledAt argument directly
      timestamp,
      timestamp,
    ],
  });
  return getDraftById(Number(result.lastInsertRowid));
};

const updateDraft = async (id, updates = {}) => {
  const existing = await getDraftById(id);
  if (!existing) {
    throw new Error("Draft introuvable.");
  }
  const nextPayload =
    updates.payload !== undefined
      ? JSON.stringify(normalizePayload(updates.payload))
      : JSON.stringify(existing.payload);
  const nextMetadata =
    updates.metadata !== undefined
      ? serializeMetadata(updates.metadata)
      : serializeMetadata(existing.metadata);
  const timestamp = getTimestamp();

  // Gestion du scheduledAt
  const nextScheduledAt = updates.scheduledAt !== undefined ? updates.scheduledAt : existing.scheduledAt;

  await db.execute({
    sql: `
      UPDATE twitter_drafts
      SET title = ?, variant = ?, status = ?, payload = ?, sourceEntryId = ?, metadata = ?, scheduledAt = ?, updatedAt = ?
      WHERE id = ?
      `,
    args: [
      updates.title !== undefined ? updates.title : existing.title,
      updates.variant !== undefined ? updates.variant : existing.variant,
      updates.status !== undefined ? updates.status : existing.status,
      nextPayload,
      updates.sourceEntryId !== undefined ? updates.sourceEntryId : existing.sourceEntryId,
      nextMetadata,
      nextScheduledAt,
      timestamp,
      id,
    ],
  });
  return getDraftById(id);
};

const markPublished = async (id, { tweetId, publishedAt }) => {
  const existing = await getDraftById(id);
  if (!existing) {
    throw new Error("Draft introuvable.");
  }
  const timestamp = getTimestamp();
  await db.execute({
    sql: `
      UPDATE twitter_drafts
      SET status = ?, publishedTweetId = ?, publishedAt = ?, updatedAt = ?
    WHERE id = ?
      `,
    args: ["published", tweetId, publishedAt, timestamp, id],
  });
  return getDraftById(id);
};

const deleteDraft = async (id) => {
  const result = await db.execute({
    sql: "DELETE FROM twitter_drafts WHERE id = ?",
    args: [id],
  });
  return result.rowsAffected > 0;
};

module.exports = {
  listDrafts,
  getDraftById,
  createDraft,
  updateDraft,
  markPublished,
  deleteDraft,
  getDueDrafts,
};
