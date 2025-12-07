const db = require("../core/database");
const { parseMetadata, serializeMetadata } = require("../core/utils");

const getTimestamp = () => new Date().toISOString();

const mapDraftRow = (row) => {
    if (!row) return null;
    return {
        id: row.id,
        title: row.title || "",
        variant: row.variant || "trade.simple",
        status: row.status || "draft",
        payload: row.payload ? JSON.parse(row.payload) : {},
        sourceEntryId: row.entry_id, // Map DB column to consistent JS property
        metadata: parseMetadata(row.metadata),
        scheduledAt: row.scheduledAt || null,
        publishedAt: row.publishedAt || null,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
    };
};

const listDrafts = async () => {
    const result = await db.execute("SELECT * FROM discord_drafts ORDER BY datetime(updatedAt) DESC");
    return result.rows.map(mapDraftRow);
};

const getDraftById = async (id) => {
    const result = await db.execute({
        sql: "SELECT * FROM discord_drafts WHERE id = ?",
        args: [id],
    });
    return mapDraftRow(result.rows[0]);
};

// New helper to get drafts pending scheduling
const getDueDrafts = async () => {
    const now = new Date().toISOString();
    // Status 'scheduled' and time passed
    const result = await db.execute({
        sql: "SELECT * FROM discord_drafts WHERE status = 'scheduled' AND scheduledAt <= ?",
        args: [now]
    });
    return result.rows.map(mapDraftRow);
};

const createDraft = async ({
    title = "",
    variant = "trade.simple",
    status = "draft",
    payload = {},
    sourceEntryId = null,
    metadata = {},
    scheduledAt = null,
} = {}) => {
    const serializedPayload = JSON.stringify(payload);
    const serializedMetadata = serializeMetadata(metadata);
    const timestamp = getTimestamp();

    const result = await db.execute({
        sql: `
      INSERT INTO discord_drafts (title, variant, status, payload, entry_id, metadata, scheduledAt, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
        args: [
            title,
            variant,
            status,
            serializedPayload,
            sourceEntryId,
            serializedMetadata,
            scheduledAt,
            timestamp,
            timestamp,
        ],
    });
    return getDraftById(Number(result.lastInsertRowid));
};

const updateDraft = async (id, updates = {}) => {
    const existing = await getDraftById(id);
    if (!existing) {
        throw new Error("Brouillon Discord introuvable.");
    }

    const nextPayload = updates.payload !== undefined
        ? JSON.stringify(updates.payload)
        : JSON.stringify(existing.payload);

    const nextMetadata = updates.metadata !== undefined
        ? serializeMetadata(updates.metadata)
        : serializeMetadata(existing.metadata);

    const nextScheduledAt = updates.scheduledAt !== undefined ? updates.scheduledAt : existing.scheduledAt;

    const timestamp = getTimestamp();

    await db.execute({
        sql: `
      UPDATE discord_drafts
      SET title = ?, variant = ?, status = ?, payload = ?, entry_id = ?, metadata = ?, scheduledAt = ?, updatedAt = ?
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

const markSent = async (id, { publishedAt, error = null }) => {
    const existing = await getDraftById(id);
    if (!existing) throw new Error("Draft introuvable.");

    const timestamp = getTimestamp();
    // If error, we might want to set status to 'failed'
    const status = error ? 'failed' : 'published';

    // We update metadata to include error if needed
    const meta = existing.metadata || {};
    if (error) meta.error = error;

    await db.execute({
        sql: `UPDATE discord_drafts SET status = ?, publishedAt = ?, metadata = ?, updatedAt = ? WHERE id = ?`,
        args: [
            status,
            publishedAt || timestamp,
            serializeMetadata(meta),
            timestamp,
            id
        ]
    });
    return getDraftById(id);
};

const deleteDraft = async (id) => {
    const result = await db.execute({
        sql: "DELETE FROM discord_drafts WHERE id = ?",
        args: [id],
    });
    return result.rowsAffected > 0;
};

module.exports = {
    listDrafts,
    getDraftById,
    createDraft,
    updateDraft,
    deleteDraft,
    markSent,
    getDueDrafts
};
