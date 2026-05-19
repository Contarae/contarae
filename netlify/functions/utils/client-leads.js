import crypto from "crypto";
import { getStore } from "@netlify/blobs";

const CLIENT_LEADS_STORE = "client-leads";
const CLIENT_LEAD_PREFIX = "lead:";

function cleanText(value = "") {
  return String(value || "").trim();
}

function formatProperName(value = "") {
  return cleanText(value)
    .toLocaleLowerCase("es-CO")
    .replace(/\s+/g, " ")
    .split(" ")
    .map((part) => {
      if (!part) return "";
      return part
        .split("-")
        .map((segment) => segment ? `${segment.charAt(0).toLocaleUpperCase("es-CO")}${segment.slice(1)}` : "")
        .join("-");
    })
    .join(" ");
}

function normalizeEmail(value = "") {
  return cleanText(value).toLowerCase();
}

function normalizePhone(value = "") {
  return String(value || "").replace(/[^\d+]/g, "").trim();
}

function parseMarketingAttribution(input = {}) {
  const rawAttribution =
    input.marketingAttribution ||
    input.marketing_attribution ||
    input.marketing_attribution_json ||
    {};
  let attribution = {};

  if (typeof rawAttribution === "string") {
    try {
      attribution = JSON.parse(rawAttribution) || {};
    } catch {
      attribution = {};
    }
  } else if (rawAttribution && typeof rawAttribution === "object") {
    attribution = rawAttribution;
  }

  const flatFields = [
    "landing_page",
    "initial_referrer",
    "latest_page",
    "latest_referrer",
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_term",
    "utm_content",
    "utm_id",
    "gclid",
    "gbraid",
    "wbraid",
    "ga_client_id",
    "attribution_captured_at",
    "attribution_updated_at",
    "campaign_landing_page",
    "campaign_captured_at"
  ];

  flatFields.forEach((field) => {
    const value = cleanText(input[field]).slice(0, 500);
    if (value) attribution[field] = value;
  });

  return Object.entries(attribution).reduce((acc, [key, value]) => {
    if (value === undefined || value === null) return acc;
    acc[key] = cleanText(value).slice(0, 500);
    return acc;
  }, {});
}

function randomId() {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function createLeadId(now = new Date()) {
  const datePart = now.toISOString().slice(0, 10).replace(/-/g, "");
  return `CLI-${datePart}-${randomId().replace(/-/g, "").slice(0, 8).toUpperCase()}`;
}

function getClientLeadsStore() {
  return getStore(CLIENT_LEADS_STORE);
}

function sanitizeLeadInput(input = {}, metadata = {}) {
  const now = new Date().toISOString();
  const name = formatProperName(input.name);
  const documentNumber = cleanText(input.documentNumber).replace(/[^\dA-Za-z.-]/g, "");
  const phone = normalizePhone(input.phone);
  const email = normalizeEmail(input.email);
  const treatmentConsent = input.treatmentConsent === true || input.treatmentConsent === "true";
  const marketingConsent = input.marketingConsent === true || input.marketingConsent === "true";
  const marketingAttribution = parseMarketingAttribution(input);

  if (!name) throw new Error("Ingresa tu nombre.");
  if (!documentNumber) throw new Error("Ingresa tu número de documento.");
  if (!phone) throw new Error("Ingresa un WhatsApp de contacto.");
  if (!email) throw new Error("Ingresa un correo de contacto.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Ingresa un correo válido.");
  if (!treatmentConsent) throw new Error("Debes autorizar el tratamiento de datos personales para enviar tus datos.");

  return {
    id: createLeadId(),
    name,
    documentNumber,
    phone,
    email,
    serviceInterest: cleanText(input.serviceInterest) || "Asesoría contable",
    comment: cleanText(input.comment).slice(0, 1200),
    status: "nuevo",
    treatmentConsent,
    marketingConsent,
    sourcePath: cleanText(input.sourcePath || metadata.sourcePath),
    sourceLabel: cleanText(input.sourceLabel || metadata.sourceLabel) || "Formulario web",
    marketingAttribution,
    landingPage: marketingAttribution.landing_page || "",
    initialReferrer: marketingAttribution.initial_referrer || "",
    utmSource: marketingAttribution.utm_source || "",
    utmMedium: marketingAttribution.utm_medium || "",
    utmCampaign: marketingAttribution.utm_campaign || "",
    utmTerm: marketingAttribution.utm_term || "",
    utmContent: marketingAttribution.utm_content || "",
    utmId: marketingAttribution.utm_id || "",
    gclid: marketingAttribution.gclid || "",
    gbraid: marketingAttribution.gbraid || "",
    wbraid: marketingAttribution.wbraid || "",
    gaClientId: marketingAttribution.ga_client_id || "",
    userAgent: cleanText(metadata.userAgent),
    ipHash: metadata.ip ? crypto.createHash("sha256").update(String(metadata.ip)).digest("hex") : "",
    createdAt: now,
    updatedAt: now
  };
}

export async function saveClientLead(input = {}, metadata = {}) {
  const store = getClientLeadsStore();
  const lead = sanitizeLeadInput(input, metadata);
  await store.setJSON(`${CLIENT_LEAD_PREFIX}${lead.id}`, lead);
  return lead;
}

export async function listClientLeads() {
  const store = getClientLeadsStore();
  const list = await store.list({ prefix: CLIENT_LEAD_PREFIX });
  const leads = await Promise.all(
    (list.blobs || []).map(async ({ key }) => store.get(key, { type: "json" }))
  );

  return leads
    .filter(Boolean)
    .sort((left, right) => new Date(right.createdAt || 0) - new Date(left.createdAt || 0));
}

export async function deleteClientLead(id = "") {
  const leadId = cleanText(id);
  if (!leadId) throw new Error("Falta el identificador del cliente captado.");

  const store = getClientLeadsStore();
  const key = `${CLIENT_LEAD_PREFIX}${leadId}`;
  const existing = await store.get(key, { type: "json" });
  if (!existing) throw new Error("El cliente captado no existe o ya fue eliminado.");

  await store.delete(key);
  return existing;
}
