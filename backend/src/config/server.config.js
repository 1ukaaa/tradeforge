const trimQuotes = (value = "") => value.replace(/^["']|["']$/g, "").trim();

const parseOrigins = (value = "") =>
  value
    .split(",")
    .map((origin) => trimQuotes(origin))
    .map((origin) => origin.trim())
    .filter(Boolean);

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
const CORS_ALLOWED_ORIGINS = parseOrigins(
  process.env.CORS_ALLOWED_ORIGINS || FRONTEND_URL
);
const CORS_ALLOW_ALL =
  CORS_ALLOWED_ORIGINS.includes("*") || CORS_ALLOWED_ORIGINS.length === 0;

const ECONOMIC_EVENTS_SOURCE_URL = trimQuotes(process.env.FOREX_FACTORY_URL || "");
const API_PORT = Number.parseInt(process.env.PORT, 10) || 5050;

module.exports = {
  FRONTEND_URL,
  CORS_ALLOWED_ORIGINS,
  CORS_ALLOW_ALL,
  ECONOMIC_EVENTS_SOURCE_URL,
  API_PORT,
};
