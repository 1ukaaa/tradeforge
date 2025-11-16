// backend/src/services/integrations.service.js

const formatHandle = (handle) => {
  if (!handle) return null;
  const trimmed = handle.trim();
  if (!trimmed) return null;
  return trimmed.startsWith("@") ? trimmed : `@${trimmed}`;
};

const getTwitterIntegration = () => {
  const accessToken = process.env.TWITTER_ACCESS_TOKEN?.trim();
  const accessSecret = process.env.TWITTER_ACCESS_SECRET?.trim();
  const handle = formatHandle(process.env.TWITTER_HANDLE);

  return {
    provider: "twitter",
    connected: Boolean(accessToken && accessSecret),
    handle,
    hasAccessToken: Boolean(accessToken),
    hasAccessSecret: Boolean(accessSecret),
  };
};

const getIntegrations = () => ({
  twitter: getTwitterIntegration(),
});

module.exports = {
  getIntegrations,
};
