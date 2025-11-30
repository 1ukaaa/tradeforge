const discordQueue = require("./discordQueue.service");
const { sendToDiscord } = require("./discordSender.service");
const { getDiscordWebhookUrl } = require("../config/discord.config");

const CHECK_INTERVAL_MS = 60 * 1000; // 1 minute

const processQueue = async () => {
    const webhookUrl = getDiscordWebhookUrl();
    if (!webhookUrl) {
        console.warn("[Scheduler] No webhook configured, skipping queue processing.");
        return;
    }

    try {
        const duePosts = await discordQueue.getDuePosts();
        if (duePosts.length === 0) return;

        console.log(`[Scheduler] Processing ${duePosts.length} due posts...`);

        for (const post of duePosts) {
            try {
                const payload = JSON.parse(post.payload);
                await sendToDiscord(webhookUrl, payload);
                await discordQueue.updateStatus(post.id, 'sent');
                console.log(`[Scheduler] Post ${post.id} sent successfully.`);
            } catch (err) {
                console.error(`[Scheduler] Failed to send post ${post.id}:`, err.message);
                await discordQueue.updateStatus(post.id, 'failed', err.message);
            }
        }
    } catch (err) {
        console.error("[Scheduler] Error processing queue:", err);
    }
};

const startScheduler = () => {
    console.log("[Scheduler] Started Discord post scheduler.");
    // Run immediately on start
    processQueue();
    // Then every interval
    setInterval(processQueue, CHECK_INTERVAL_MS);
};

module.exports = { startScheduler };
