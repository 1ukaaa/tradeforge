// backend/src/core/crypto.js
const crypto = require("crypto");

const ALGORITHM = "aes-256-gcm";
const SECRET = process.env.BROKER_SECRET || "dev-broker-secret";
const KEY = crypto.createHash("sha256").update(SECRET).digest();

const encrypt = (plaintext) => {
  if (!plaintext) return "";
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  let encrypted = cipher.update(String(plaintext), "utf8", "base64");
  encrypted += cipher.final("base64");
  const authTag = cipher.getAuthTag().toString("base64");
  return `${iv.toString("base64")}:${authTag}:${encrypted}`;
};

const decrypt = (payload) => {
  if (!payload) return "";
  const [ivStr, authTagStr, data] = payload.split(":");
  if (!ivStr || !authTagStr || !data) return "";
  const iv = Buffer.from(ivStr, "base64");
  const authTag = Buffer.from(authTagStr, "base64");
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(data, "base64", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
};

module.exports = {
  encrypt,
  decrypt,
};

