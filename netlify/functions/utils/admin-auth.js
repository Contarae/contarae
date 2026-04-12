import crypto from "crypto";

export const ADMIN_SESSION_COOKIE = "contarae_admin_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;

function toBase64Url(value) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function fromBase64Url(value) {
  const normalized = String(value || "")
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  return Buffer.from(`${normalized}${padding}`, "base64").toString("utf8");
}

function digest(value) {
  return crypto.createHash("sha256").update(String(value || "")).digest();
}

function safeEqual(left, right) {
  return crypto.timingSafeEqual(digest(left), digest(right));
}

function signValue(value, secret) {
  return crypto
    .createHmac("sha256", secret)
    .update(value)
    .digest("hex");
}

function parseCookies(req) {
  const rawCookie = req.headers.get("cookie") || "";
  return rawCookie
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce((acc, item) => {
      const [name, ...rest] = item.split("=");
      acc[name] = decodeURIComponent(rest.join("=") || "");
      return acc;
    }, {});
}

export function getAdminConfig() {
  const username =
    process.env.ADMIN_PANEL_USERNAME ||
    process.env.ADMIN_USERNAME ||
    "";
  const password =
    process.env.ADMIN_PANEL_PASSWORD ||
    process.env.ADMIN_PASSWORD ||
    "";
  const secret =
    process.env.ADMIN_PANEL_SECRET ||
    process.env.ADMIN_SECRET ||
    "";

  return {
    username,
    password,
    secret,
    configured: Boolean(username && password && secret)
  };
}

export function createAdminSession(username, secret, maxAgeSeconds = SESSION_MAX_AGE_SECONDS) {
  const payload = {
    u: username,
    exp: Date.now() + maxAgeSeconds * 1000
  };
  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signature = signValue(encodedPayload, secret);
  return `${encodedPayload}.${signature}`;
}

export function verifyAdminSession(token, secret) {
  if (!token || !secret) return null;

  const [encodedPayload, signature] = String(token).split(".");
  if (!encodedPayload || !signature) return null;

  const expectedSignature = signValue(encodedPayload, secret);
  if (!safeEqual(signature, expectedSignature)) return null;

  try {
    const payload = JSON.parse(fromBase64Url(encodedPayload));
    if (!payload?.u || !payload?.exp || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export function authenticateAdminCredentials(username, password) {
  const config = getAdminConfig();

  if (!config.configured) {
    return { ok: false, reason: "missing_config" };
  }

  const usernameMatches = safeEqual(username, config.username);
  const passwordMatches = safeEqual(password, config.password);

  return {
    ok: usernameMatches && passwordMatches,
    reason: usernameMatches && passwordMatches ? "ok" : "invalid_credentials",
    config
  };
}

export function getAdminSessionFromRequest(req) {
  const config = getAdminConfig();

  if (!config.configured) {
    return {
      configured: false,
      authenticated: false,
      username: "",
      expiresAt: null
    };
  }

  const cookies = parseCookies(req);
  const payload = verifyAdminSession(cookies[ADMIN_SESSION_COOKIE], config.secret);

  if (!payload) {
    return {
      configured: true,
      authenticated: false,
      username: "",
      expiresAt: null
    };
  }

  return {
    configured: true,
    authenticated: true,
    username: payload.u,
    expiresAt: payload.exp
  };
}

export function buildAdminSessionCookie(req, token, maxAgeSeconds = SESSION_MAX_AGE_SECONDS) {
  const secure = req.url.startsWith("https://") || process.env.CONTEXT === "production";
  return [
    `${ADMIN_SESSION_COOKIE}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxAgeSeconds}`,
    secure ? "Secure" : ""
  ]
    .filter(Boolean)
    .join("; ");
}

export function buildAdminLogoutCookie(req) {
  const secure = req.url.startsWith("https://") || process.env.CONTEXT === "production";
  return [
    `${ADMIN_SESSION_COOKIE}=`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=0",
    "Expires=Thu, 01 Jan 1970 00:00:00 GMT",
    secure ? "Secure" : ""
  ]
    .filter(Boolean)
    .join("; ");
}

export function buildAdminHeaders(extra = {}) {
  return {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
    ...extra
  };
}
