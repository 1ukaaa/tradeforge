const db = require("../core/database");

const addToQueue = async (payload, scheduledAt) => {
    const result = await db.execute({
        sql: "INSERT INTO discord_queue (payload, scheduledAt, status, createdAt) VALUES (?, ?, 'pending', ?)",
        args: [JSON.stringify(payload), scheduledAt, new Date().toISOString()]
    });
    return result;
};

const getDuePosts = async () => {
    const now = new Date().toISOString();
    const result = await db.execute({
        sql: "SELECT * FROM discord_queue WHERE status = 'pending' AND scheduledAt <= ?",
        args: [now]
    });
    return result.rows;
};

const updateStatus = async (id, status, error = null) => {
    await db.execute({
        sql: "UPDATE discord_queue SET status = ?, error = ? WHERE id = ?",
        args: [status, error, id]
    });
};

module.exports = {
    addToQueue,
    getDuePosts,
    updateStatus
};
