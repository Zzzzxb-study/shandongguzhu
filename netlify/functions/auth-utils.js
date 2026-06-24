const crypto = require("crypto");

const DEFAULT_AUTH_TTL_MS = 12 * 60 * 60 * 1000;
const CODE_TTL_MS = 10 * 60 * 1000;

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
    },
    body: JSON.stringify(body),
  };
}

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 24) {
    throw new Error("AUTH_SECRET must be at least 24 characters");
  }
  return secret;
}

function base64url(input) {
  return Buffer.from(input).toString("base64url");
}

function fromBase64url(input) {
  return Buffer.from(input, "base64url").toString("utf8");
}

function sign(value) {
  return crypto.createHmac("sha256", getSecret()).update(value).digest("base64url");
}

function timingSafeEqual(a, b) {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function signPayload(payload) {
  const encoded = base64url(JSON.stringify(payload));
  return `${encoded}.${sign(encoded)}`;
}

function readSignedPayload(token) {
  const [encoded, signature] = String(token || "").split(".");
  if (!encoded || !signature || !timingSafeEqual(signature, sign(encoded))) return null;
  try {
    return JSON.parse(fromBase64url(encoded));
  } catch (_error) {
    return null;
  }
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function isEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isAllowedEmail(email) {
  const domains = String(process.env.AUTH_ALLOWED_DOMAINS || "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  if (!domains.length) return true;
  const domain = email.split("@")[1];
  return domains.includes(domain);
}

function hashCode(email, code) {
  return crypto.createHash("sha256").update(`${normalizeEmail(email)}:${String(code).trim()}:${getSecret()}`).digest("hex");
}

function authTtlMs() {
  const hours = Number(process.env.AUTH_SESSION_HOURS || 12);
  return Number.isFinite(hours) && hours > 0 ? hours * 60 * 60 * 1000 : DEFAULT_AUTH_TTL_MS;
}

module.exports = {
  CODE_TTL_MS,
  authTtlMs,
  hashCode,
  isAllowedEmail,
  isEmail,
  json,
  normalizeEmail,
  readSignedPayload,
  signPayload,
};