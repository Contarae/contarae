import { getStore } from "@netlify/blobs";
import crypto from "crypto";

const SECURITY_AUDIT_STORE = "security-audit";
const SECURITY_AUDIT_PREFIX = "event:";

function cleanText(value = "", maxLength = 500) {
  return String(value || "").trim().slice(0, maxLength);
}

function randomId() {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function getHeader(req, name) {
  if (typeof req?.headers?.get === "function") return req.headers.get(name) || "";
  return "";
}

function getIpHash(req) {
  const ip =
    getHeader(req, "x-nf-client-connection-ip") ||
    getHeader(req, "client-ip") ||
    getHeader(req, "x-forwarded-for") ||
    "";
  return ip ? crypto.createHash("sha256").update(String(ip)).digest("hex") : "";
}

export async function recordSecurityEvent(req, event = {}) {
  try {
    const now = new Date();
    const id = `${now.toISOString()}-${randomId()}`;
    const record = {
      id,
      type: cleanText(event.type, 80),
      actor: cleanText(event.actor, 120),
      subject: cleanText(event.subject, 180),
      outcome: cleanText(event.outcome || "ok", 40),
      reason: cleanText(event.reason, 180),
      details: event.details && typeof event.details === "object" ? event.details : {},
      userAgent: cleanText(getHeader(req, "user-agent"), 300),
      ipHash: getIpHash(req),
      createdAt: now.toISOString()
    };
    await getStore(SECURITY_AUDIT_STORE).setJSON(`${SECURITY_AUDIT_PREFIX}${id}`, record);
    return record;
  } catch {
    return null;
  }
}
