const getDiscordWebhookUrl = () =>
  (process.env.DISCORD_WEBHOOK_URL || process.env.REACT_APP_DISCORD_WEBHOOK_URL || "").trim();

const hasDiscordWebhookConfigured = () => getDiscordWebhookUrl().length > 0;

module.exports = {
  getDiscordWebhookUrl,
  hasDiscordWebhookConfigured,
};

