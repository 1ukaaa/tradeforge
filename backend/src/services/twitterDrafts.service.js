// backend/src/services/twitterDrafts.service.js
const db = require("../core/database");
const { parseMetadata, serializeMetadata } = require("../core/utils");

const ensureArray = (value) => (Array.isArray(value) ? value : []);

const normalizeTweet = (tweet = {}, index = 0, seed = Date.now()) => ({
  id: tweet.id || `tweet-${seed}-${index + 1}`,
  text: typeof tweet.text === "string" ? tweet.text : "",
  media: ensureArray(tweet.media),
});

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
  const sanitizedTweets = ensureArray(source.tweets).map((tweet, index) =>
    normalizeTweet(tweet, index, seed)
  );
  const tweets = sanitizedTweets.length > 0 ? sanitizedTweets : [normalizeTweet({}, 0, seed)];
  const attachments = ensureArray(source.attachments)
    .map((attachment, index) => normalizeAttachment(attachment, index, seed))
    .filter(Boolean);
  return {
    tweets,
    attachments,
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
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
};

const listDrafts = () => {
  const rows = db
    .prepare("SELECT * FROM twitter_drafts ORDER BY datetime(updatedAt) DESC")
    .all();
  return rows.map(mapDraftRow);
};

const getDraftById = (id) => {
  const row = db.prepare("SELECT * FROM twitter_drafts WHERE id = ?").get(id);
  return mapDraftRow(row);
};

const createDraft = ({
  title = "",
  variant = "tweet.simple",
  status = "draft",
  payload = {},
  sourceEntryId = null,
  metadata = {},
} = {}) => {
  const normalizedPayload = normalizePayload(payload);
  const serializedPayload = JSON.stringify(normalizedPayload);
  const serializedMetadata = serializeMetadata(metadata);
  const timestamp = getTimestamp();
  const stmt = db.prepare(`
    INSERT INTO twitter_drafts (title, variant, status, payload, sourceEntryId, metadata, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const info = stmt.run(
    title,
    variant,
    status,
    serializedPayload,
    sourceEntryId,
    serializedMetadata,
    timestamp,
    timestamp
  );
  return getDraftById(info.lastInsertRowid);
};

const updateDraft = (id, updates = {}) => {
  const existing = getDraftById(id);
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
  const stmt = db.prepare(
    `
    UPDATE twitter_drafts
    SET title = ?, variant = ?, status = ?, payload = ?, sourceEntryId = ?, metadata = ?, updatedAt = ?
    WHERE id = ?
  `
  );
  const timestamp = getTimestamp();
  stmt.run(
    updates.title !== undefined ? updates.title : existing.title,
    updates.variant !== undefined ? updates.variant : existing.variant,
    updates.status !== undefined ? updates.status : existing.status,
    nextPayload,
    updates.sourceEntryId !== undefined ? updates.sourceEntryId : existing.sourceEntryId,
    nextMetadata,
    timestamp,
    id
  );
  return getDraftById(id);
};

const markPublished = (id, { tweetId, publishedAt }) => {
  const existing = getDraftById(id);
  if (!existing) {
    throw new Error("Draft introuvable.");
  }
  const timestamp = getTimestamp();
  db.prepare(
    `
    UPDATE twitter_drafts
    SET status = ?, publishedTweetId = ?, publishedAt = ?, updatedAt = ?
    WHERE id = ?
  `
  ).run("published", tweetId, publishedAt, timestamp, id);
  return getDraftById(id);
};

const deleteDraft = (id) => {
  const info = db.prepare("DELETE FROM twitter_drafts WHERE id = ?").run(id);
  return info.changes > 0;
};

module.exports = {
  listDrafts,
  getDraftById,
  createDraft,
  updateDraft,
  markPublished,
  deleteDraft,
};
