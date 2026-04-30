import crypto from "crypto";
import { getStore } from "@netlify/blobs";

const CLIENT_LEADS_STORE = "client-leads";
const CLIENT_LEAD_PREFIX = "lead:";

function cleanText(value = "") {
  return String(value || "").trim();
}

function normalizeEmail(value = "") {
  return cleanText(value).toLowerCase();
}

function normalizePhone(value = "") {
  return String(value || "").replace(/[^\d+]/g, "").trim();
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
  const name = cleanText(input.name);
  const phone = normalizePhone(input.phone);
  const email = normalizeEmail(input.email);
  const treatmentConsent = input.treatmentConsent === true || input.treatmentConsent === "true";
  const marketingConsent = input.marketingConsent === true || input.marketingConsent === "true";

  if (!name) throw new Error("Ingresa tu nombre.");
  if (!phone && !email) throw new Error("Ingresa un WhatsApp o correo de contacto.");
  if (!treatmentConsent) throw new Error("Debes autorizar el tratamiento de datos personales para enviar tus datos.");

  return {
    id: createLeadId(),
    name,
    documentNumber: cleanText(input.documentNumber).replace(/[^\dA-Za-z.-]/g, ""),
    phone,
    email,
    serviceInterest: cleanText(input.serviceInterest) || "Asesoría contable",
    comment: cleanText(input.comment).slice(0, 1200),
    status: "nuevo",
    treatmentConsent,
    marketingConsent,
    sourcePath: cleanText(input.sourcePath || metadata.sourcePath),
    sourceLabel: cleanText(input.sourceLabel || metadata.sourceLabel) || "Formulario web",
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
