const DEFAULT_ALLOWED_ORIGINS = new Set([
  "https://contarae.com",
  "https://www.contarae.com",
  "http://localhost:3000",
  "http://localhost:3010",
  "http://localhost:3020",
  "http://localhost:8888",
  "http://localhost:8899",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3010",
  "http://127.0.0.1:3020",
  "http://127.0.0.1:8888",
  "http://127.0.0.1:8899"
]);

function getOrigin(source) {
  if (!source) return "";
  if (typeof source.headers?.get === "function") {
    return String(source.headers.get("origin") || "").trim();
  }
  const headers = source.headers || {};
  return String(headers.origin || headers.Origin || "").trim();
}

function isAllowedOrigin(origin = "") {
  if (!origin) return false;
  if (DEFAULT_ALLOWED_ORIGINS.has(origin)) return true;
  return /^https:\/\/[a-z0-9-]+--stately-brioche-5a0c2e\.netlify\.app$/i.test(origin);
}

function buildCorsHeaders(source, extra = {}) {
  const origin = getOrigin(source);
  const headers = {
    "Access-Control-Allow-Headers": "Content-Type, X-Event-Checksum",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    ...extra
  };

  if (isAllowedOrigin(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers.Vary = [headers.Vary, "Origin"].filter(Boolean).join(", ");
  }

  return headers;
}

module.exports = {
  buildCorsHeaders,
  isAllowedOrigin
};
