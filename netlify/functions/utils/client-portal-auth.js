import crypto from "crypto";
import { authenticateStoredClientPortalUser } from "./client-portal-users.js";

export const CLIENT_PORTAL_SESSION_COOKIE = "contarae_client_portal_session";
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
  return crypto.createHmac("sha256", secret).update(value).digest("hex");
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

function parseUsersJson() {
  const raw = process.env.CLIENT_PORTAL_USERS_JSON || "";
  if (!raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function getClientPortalConfig() {
  const secret =
    process.env.CLIENT_PORTAL_SECRET ||
    process.env.ADMIN_PANEL_SECRET ||
    process.env.ADMIN_SECRET ||
    "";

  const usersFromJson = parseUsersJson()
    .map((user) => ({
      username: String(user?.username || "").trim(),
      password: String(user?.password || ""),
      companyId: String(user?.companyId || user?.company_id || "").trim(),
      companyName: String(user?.companyName || user?.company_name || "").trim()
    }))
    .filter((user) => user.username && user.password && user.companyId);

  const singleUser = {
    username: process.env.CLIENT_PORTAL_USERNAME || process.env.CLIENT_PORTAL_USER || "",
    password: process.env.CLIENT_PORTAL_PASSWORD || "",
    companyId: process.env.CLIENT_PORTAL_COMPANY_ID || "empresa-principal",
    companyName: process.env.CLIENT_PORTAL_COMPANY_NAME || "Mi empresa"
  };

  const users = usersFromJson.length
    ? usersFromJson
    : singleUser.username && singleUser.password
      ? [singleUser]
      : [];

  return {
    secret,
    users,
    configured: Boolean(secret)
  };
}

export async function authenticateClientPortalCredentials(username, password) {
  const config = getClientPortalConfig();
  if (!config.configured) return { ok: false, reason: "missing_config" };

  const normalizedUsername = String(username || "").trim();
  const storedAuth = await authenticateStoredClientPortalUser(normalizedUsername, password);
  if (storedAuth.ok) {
    return {
      ok: true,
      reason: "ok",
      config,
      user: storedAuth.user
    };
  }
  if (storedAuth.reason === "suspended") return { ok: false, reason: "suspended", config };

  const user = config.users.find((candidate) => safeEqual(normalizedUsername, candidate.username));
  if (!user || !safeEqual(password, user.password)) {
    return { ok: false, reason: "invalid_credentials", config };
  }

  return {
    ok: true,
    reason: "ok",
    config,
    user: {
      username: user.username,
      companyId: user.companyId,
      companyName: user.companyName || user.companyId,
      mustChangePassword: false
    }
  };
}

export function createClientPortalSession(user, secret, maxAgeSeconds = SESSION_MAX_AGE_SECONDS, options = {}) {
  const payload = {
    u: user.username,
    c: user.companyId,
    n: user.companyName,
    m: Boolean(user.mustChangePassword && !options.impersonatedBy),
    i: options.impersonatedBy || "",
    r: options.role || (options.impersonatedBy ? "support" : "client"),
    exp: Date.now() + maxAgeSeconds * 1000
  };
  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signature = signValue(encodedPayload, secret);
  return `${encodedPayload}.${signature}`;
}

export function verifyClientPortalSession(token, secret) {
  if (!token || !secret) return null;

  const [encodedPayload, signature] = String(token).split(".");
  if (!encodedPayload || !signature) return null;

  const expectedSignature = signValue(encodedPayload, secret);
  if (!safeEqual(signature, expectedSignature)) return null;

  try {
    const payload = JSON.parse(fromBase64Url(encodedPayload));
    if (!payload?.u || !payload?.c || !payload?.exp || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export function getClientPortalSessionFromRequest(req) {
  const config = getClientPortalConfig();
  if (!config.configured) {
    return {
      configured: false,
      authenticated: false,
      username: "",
      companyId: "",
      companyName: "",
      expiresAt: null
    };
  }

  const cookies = parseCookies(req);
  const payload = verifyClientPortalSession(cookies[CLIENT_PORTAL_SESSION_COOKIE], config.secret);
  if (!payload) {
    return {
      configured: true,
      authenticated: false,
      username: "",
      companyId: "",
      companyName: "",
      expiresAt: null
    };
  }

  return {
    configured: true,
    authenticated: true,
    username: payload.u,
    companyId: payload.c,
    companyName: payload.n || payload.c,
    mustChangePassword: Boolean(payload.m),
    impersonatedBy: payload.i || "",
    role: payload.r || "client",
    expiresAt: payload.exp
  };
}

export function buildClientPortalSessionCookie(req, token, maxAgeSeconds = SESSION_MAX_AGE_SECONDS) {
  const secure = req.url.startsWith("https://") || process.env.CONTEXT === "production";
  return [
    `${CLIENT_PORTAL_SESSION_COOKIE}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxAgeSeconds}`,
    secure ? "Secure" : ""
  ]
    .filter(Boolean)
    .join("; ");
}

export function buildClientPortalLogoutCookie(req) {
  const secure = req.url.startsWith("https://") || process.env.CONTEXT === "production";
  return [
    `${CLIENT_PORTAL_SESSION_COOKIE}=`,
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

export function buildClientPortalHeaders(extra = {}) {
  return {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
    ...extra
  };
}
