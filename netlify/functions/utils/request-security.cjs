const crypto = require("crypto");

const DEFAULT_JSON_LIMIT_BYTES = 64 * 1024;
const HONEYPOT_FIELDS = [
  "website",
  "url",
  "homepage",
  "company_website",
  "contact_time"
];

function getHeader(headers, name) {
  if (!headers) return "";
  if (typeof headers.get === "function") return headers.get(name) || "";
  return headers[name] || headers[name.toLowerCase()] || headers[name.toUpperCase()] || "";
}

function getContentLength(source) {
  return Number(getHeader(source?.headers || source, "content-length") || 0) || 0;
}

function assertContentLength(source, maxBytes = DEFAULT_JSON_LIMIT_BYTES) {
  const contentLength = getContentLength(source);
  if (contentLength > maxBytes) {
    const error = new Error("La solicitud supera el tamaño permitido.");
    error.status = 413;
    throw error;
  }
}

function hasFilledHoneypot(input = {}) {
  return HONEYPOT_FIELDS.some((field) => String(input?.[field] || "").trim());
}

function assertNoHoneypot(input = {}) {
  if (!hasFilledHoneypot(input)) return;
  const error = new Error("No fue posible procesar la solicitud.");
  error.status = 400;
  throw error;
}

function cleanRequestText(value = "", maxLength = 500) {
  return String(value || "")
    .replace(/\u0000/g, "")
    .trim()
    .slice(0, maxLength);
}

function getClientIpHash(reqOrEvent) {
  const headers = reqOrEvent?.headers || {};
  const ip =
    getHeader(headers, "x-nf-client-connection-ip") ||
    getHeader(headers, "client-ip") ||
    getHeader(headers, "x-forwarded-for") ||
    "";
  return ip ? crypto.createHash("sha256").update(String(ip)).digest("hex") : "";
}

module.exports = {
  DEFAULT_JSON_LIMIT_BYTES,
  assertContentLength,
  assertNoHoneypot,
  cleanRequestText,
  getClientIpHash,
  hasFilledHoneypot
};
