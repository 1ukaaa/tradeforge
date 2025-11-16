// backend/src/services/twitterPublisher.service.js
const { TwitterApi } = require("twitter-api-v2");

const requiredEnv = (key) => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`La variable ${key} est requise pour publier sur Twitter.`);
  }
  return value;
};

const createClient = () => {
  const appKey = requiredEnv("TWITTER_API_KEY");
  const appSecret = requiredEnv("TWITTER_API_SECRET");
  const accessToken = requiredEnv("TWITTER_ACCESS_TOKEN");
  const accessSecret = requiredEnv("TWITTER_ACCESS_SECRET");
  return new TwitterApi({
    appKey,
    appSecret,
    accessToken,
    accessSecret,
  });
};

const DATA_URL_REGEX = /^data:(.+?);base64,(.+)$/;

const dataUrlToBuffer = (src) => {
  const match = DATA_URL_REGEX.exec(src || "");
  if (!match) {
    throw new Error("Format d'image non supporté.");
  }
  const [, mimeType, base64] = match;
  return {
    mimeType,
    buffer: Buffer.from(base64, "base64"),
  };
};

const uploadAttachments = async (client, attachments = []) => {
  if (!Array.isArray(attachments) || attachments.length === 0) {
    return [];
  }
  const uploads = [];
  for (const attachment of attachments) {
    if (!attachment?.src) continue;
    try {
      const { mimeType, buffer } = dataUrlToBuffer(attachment.src);
      const mediaId = await client.v1.uploadMedia(buffer, { mimeType });
      uploads.push(mediaId);
    } catch (error) {
      console.warn("Échec upload média Twitter :", error.message);
    }
  }
  return uploads;
};

const publishThread = async (payload = {}) => {
  const tweets = Array.isArray(payload.tweets) ? payload.tweets : [];
  if (!tweets.length) {
    throw new Error("Aucun tweet à publier.");
  }

  const client = createClient();
  const tweetMediaMap = [];
  for (let index = 0; index < tweets.length; index += 1) {
    const tweet = tweets[index];
    const attachments = Array.isArray(tweet.media) ? tweet.media : [];
    // Compatibilité avec anciens brouillons
    const legacyAttachments =
      index === 0 && (!attachments.length) && Array.isArray(payload.attachments)
        ? payload.attachments
        : [];
    const mediaToUpload = attachments.length ? attachments : legacyAttachments;
    const uploaded = await uploadAttachments(client, mediaToUpload);
    tweetMediaMap.push(uploaded.slice(0, 4)); // Twitter limite à 4 médias
  }
  let replyToId = null;
  const publishedTweets = [];

  for (let index = 0; index < tweets.length; index += 1) {
    const tweet = tweets[index];
    const text = (tweet.text || "").trim();
    if (!text) {
      throw new Error("Un tweet vide ne peut pas être publié.");
    }
    if (text.length > 280) {
      throw new Error("Un tweet dépasse la limite de 280 caractères.");
    }
    const options = {};
    if (replyToId) {
      options.reply = { in_reply_to_tweet_id: replyToId };
    }
    if (tweetMediaMap[index]?.length) {
      options.media = { media_ids: tweetMediaMap[index] };
    }
    const response = await client.v2.tweet(text, options);
    const tweetId = response?.data?.id;
    if (!tweetId) {
      throw new Error("Twitter n'a pas retourné d'identifiant de tweet.");
    }
    publishedTweets.push({
      localId: tweet.id,
      text,
      twitterId: tweetId,
      mediaAttached: tweetMediaMap[index]?.length || 0,
    });
    replyToId = tweetId;
  }

  return {
    tweets: publishedTweets,
    firstTweetId: publishedTweets[0]?.twitterId || null,
    lastTweetId: replyToId,
  };
};

module.exports = {
  publishThread,
};
