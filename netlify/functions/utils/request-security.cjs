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

function requestError(message, status) {
  return Object.assign(new Error(message), { status });
}

function parseJsonObject(text) {
  let value;
  try {
    value = JSON.parse(text);
  } catch {
    throw requestError("La solicitud no contiene un JSON válido.", 400);
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw requestError("La solicitud debe contener un objeto JSON.", 400);
  }
  return value;
}

async function readJsonBody(req, maxBytes = DEFAULT_JSON_LIMIT_BYTES) {
  assertContentLength(req, maxBytes);
  const reader = req.body?.getReader();
  if (!reader) return parseJsonObject("");
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) {
        await reader.cancel().catch(() => {});
        throw requestError("La solicitud supera el tamaño permitido.", 413);
      }
      chunks.push(Buffer.from(value));
    }
  } finally {
    reader.releaseLock();
  }
  return parseJsonObject(Buffer.concat(chunks, size).toString("utf8"));
}

function readEventJsonBody(event, maxBytes = DEFAULT_JSON_LIMIT_BYTES) {
  assertContentLength(event, maxBytes);
  const body = String(event.body || "{}");
  // Lambda may encode the payload as base64. Bound it before decoding as well.
  if (event.isBase64Encoded && body.length > 4 * Math.ceil(maxBytes / 3)) {
    throw requestError("La solicitud supera el tamaño permitido.", 413);
  }
  const bytes = Buffer.from(body, event.isBase64Encoded ? "base64" : "utf8");
  if (bytes.byteLength > maxBytes) throw requestError("La solicitud supera el tamaño permitido.", 413);
  return parseJsonObject(bytes.toString("utf8"));
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
  hasFilledHoneypot,
  readJsonBody,
  readEventJsonBody
};
