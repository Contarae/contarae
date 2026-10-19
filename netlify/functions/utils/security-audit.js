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

export async function listSecurityEvents(options = {}) {
  const {
    limit = 20,
    getStoreImpl = getStore,
    date = new Date(),
    days = 30
  } = options;
  const store = getStoreImpl(SECURITY_AUDIT_STORE, { consistency: "strong" });
  const count = Math.max(1, Math.min(Number(limit || 20), 100));
  const keys = [];
  // Prefix queries keep the dashboard independent from the full audit history.
  for (let offset = 0; offset < Math.max(1, Math.min(days, 30)) && keys.length < count; offset++) {
    const day = new Date(date);
    day.setUTCDate(day.getUTCDate() - offset);
    const list = await store.list({ prefix: `${SECURITY_AUDIT_PREFIX}${day.toISOString().slice(0, 10)}` });
    keys.push(...(list.blobs || []).map(blob => blob.key).sort().reverse().slice(0, count - keys.length));
  }
  const events = await Promise.all(keys.map((key) => store.get(key, { type: "json" })));
  return events.filter(Boolean).map((event) => ({
    id: event.id || "",
    type: event.type || "",
    actor: event.actor || "",
    subject: event.subject || "",
    outcome: event.outcome || "",
    reason: event.reason || "",
    createdAt: event.createdAt || ""
  }));
}
