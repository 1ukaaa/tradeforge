const discordDrafts = require("./discordDrafts.service");
const twitterDrafts = require("./twitterDrafts.service");
const { sendToDiscord } = require("./discordSender.service");
const { publishThread } = require("./twitterPublisher.service");
const { getDiscordWebhookUrl } = require("../config/discord.config");

const CHECK_INTERVAL_MS = 60 * 1000; // 1 minute

const processDiscordQueue = async () => {
    const webhookUrl = getDiscordWebhookUrl();
    if (!webhookUrl) return;

    try {
        const dueDrafts = await discordDrafts.getDueDrafts();
        if (dueDrafts.length === 0) return;

        console.log(`[Scheduler] Processing ${dueDrafts.length} due Discord posts...`);

        for (const draft of dueDrafts) {
            try {
                // Determine payload: check if it's already a correct payload or needs parsing
                // The service returns mapped objects where payload is already an object
                const result = await sendToDiscord(webhookUrl, draft.payload);

                await discordDrafts.markSent(draft.id, {
                    publishedAt: new Date().toISOString()
                });
                console.log(`[Scheduler] Discord post ${draft.id} sent successfully.`);
            } catch (err) {
                console.error(`[Scheduler] Failed to send Discord post ${draft.id}:`, err.message);
                await discordDrafts.markSent(draft.id, {
                    error: err.message
                }); // markSent handles error status
            }
        }
    } catch (err) {
        console.error("[Scheduler] Error processing Discord queue:", err);
    }
};

const processTwitterQueue = async () => {
    // Check if Twitter credentials exist before processing? 
    // twitterPublisher throws if env vars are missing. 
    // We can try/catch the whole block or just rely on the first failure.
    try {
        const dueDrafts = await twitterDrafts.getDueDrafts();
        if (dueDrafts.length === 0) return;

        console.log(`[Scheduler] Processing ${dueDrafts.length} due Twitter threads...`);

        for (const draft of dueDrafts) {
            try {
                const publishResult = await publishThread(draft.payload);
                await twitterDrafts.markPublished(draft.id, {
                    tweetId: publishResult.firstTweetId,
                    publishedAt: new Date().toISOString()
                });
                console.log(`[Scheduler] Twitter thread ${draft.id} sent successfully.`);
            } catch (err) {
                console.error(`[Scheduler] Failed to send Twitter thread ${draft.id}:`, err.message);
                // Implementation detail: markPublished sets status to 'published'. 
                // We might need 'failed' status for Twitter too but currently it stays 'scheduled' (so it retries forever?) 
                // or we should update it to failed. 
                // twitterDrafts.service doesn't have markFailed. 
                // For now, let's leave it or implement a simple update to 'failed'.
                await twitterDrafts.updateDraft(draft.id, {
                    status: 'failed',
                    metadata: { error: err.message }
                });
            }
        }
    } catch (err) {
        // If config is missing, it might throw immediately.
        // Silence detailed errors if just config missing, or log?
        if (err.message && err.message.includes("est requise")) {
            // Config missing logic from publisher
            return;
        }
        console.error("[Scheduler] Error processing Twitter queue:", err);
    }
};

const processAll = async () => {
    await Promise.all([processDiscordQueue(), processTwitterQueue()]);
};

const startScheduler = () => {
    console.log("[Scheduler] Started Unified Post Scheduler.");
    processAll();
    setInterval(processAll, CHECK_INTERVAL_MS);
};

module.exports = { startScheduler };
