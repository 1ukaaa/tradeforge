// backend/src/core/database.js
require("dotenv").config();
const { createClient } = require("@libsql/client");

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
  // En local, assure-toi d'avoir un fichier .env avec ces variables
  console.warn("ATTENTION: TURSO_DATABASE_URL ou TURSO_AUTH_TOKEN manquant.");
}

const db = createClient({
  url: url || "file:local.db", // Fallback pour éviter le crash immédiat si config manquante
  authToken,
});

module.exports = db;