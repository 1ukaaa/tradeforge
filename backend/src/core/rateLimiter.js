// backend/src/core/rateLimiter.js
// Petite implémentation en mémoire d'un rate limiter sliding-window
// Permet de limiter soit le nombre de requêtes, soit un poids (ex: tokens)

const buckets = new Map();

const createRateLimitError = (message) => {
  const error = new Error(message);
  error.name = "RateLimitError";
  error.status = 429;
  return error;
};

const getBucket = (key) => {
  const bucket = buckets.get(key);
  if (bucket) return bucket;
  const fresh = [];
  buckets.set(key, fresh);
  return fresh;
};

const enforceRateLimit = (key, { windowMs, max, weight = 1, message } = {}) => {
  if (!windowMs || !max) {
    throw new Error("Configuration de rate limit invalide.");
  }
  const now = Date.now();
  const bucket = getBucket(key).filter((entry) => now - entry.ts < windowMs);
  const currentTotal = bucket.reduce((sum, entry) => sum + entry.weight, 0);
  if (currentTotal + weight > max) {
    throw createRateLimitError(
      message ||
        `Limite atteinte pour ${key} (${currentTotal}/${max} consommé${currentTotal > 1 ? "s" : ""}).`
    );
  }
  bucket.push({ ts: now, weight });
  buckets.set(key, bucket);
  return {
    total: currentTotal + weight,
    remaining: Math.max(0, max - currentTotal - weight),
  };
};

module.exports = {
  enforceRateLimit,
  createRateLimitError,
};
