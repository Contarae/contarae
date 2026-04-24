import crypto from "crypto";
import { getStore } from "@netlify/blobs";
import {
  formatBytes,
  isAllowedSupportContentType,
  normalizeContentType,
  normalizeReference,
  sanitizeFileName
} from "./certification-supports.js";

const SERVICE_STORE_NAME = "service-requests";
const SERVICE_REQUEST_PREFIX = "request:";
const SERVICE_DOCUMENT_PREFIX = "service-documents";
const MAX_SERVICE_DOCUMENTS_PER_UPLOAD = 8;
const MAX_SERVICE_DOCUMENT_SIZE = 10 * 1024 * 1024;

export const SERVICE_REQUEST_STATUSES = [
  "nuevo",
  "cotizado",
  "pendiente_documentos",
  "en_proceso",
  "pendiente_pago",
  "finalizado",
  "cancelado"
];

export const SERVICE_PAYMENT_STATUSES = [
  "pendiente",
  "parcial",
  "pagado",
  "pagado_manual",
  "no_requiere"
];

const DEFAULT_SERVICE_TYPE = "otros";

function cleanText(value = "") {
  return String(value || "").trim();
}

function normalizeDocumentNumber(value = "") {
  return String(value || "").replace(/[^\dA-Za-z.-]/g, "").trim();
}

function parseCurrency(value) {
  const raw = String(value || "").trim();
  if (!raw) return 0;

  const normalized = raw.replace(/\$/g, "").replace(/\s+/g, "").replace(/[^\d,.-]/g, "");
  if (!normalized) return 0;

  if (normalized.includes(",") && normalized.includes(".")) {
    return Number(normalized.replace(/\./g, "").replace(",", ".")) || 0;
  }

  if (normalized.includes(",")) {
    const commaParts = normalized.split(",");
    if (commaParts.length === 2 && commaParts[1].length <= 2) {
      return Number(normalized.replace(/\./g, "").replace(",", ".")) || 0;
    }
    return Number(normalized.replace(/,/g, "")) || 0;
  }

  if (normalized.includes(".")) {
    const dotParts = normalized.split(".");
    if (dotParts.length > 2) return Number(dotParts.join("")) || 0;
    if (dotParts.length === 2 && dotParts[1].length === 3) return Number(dotParts.join("")) || 0;
  }

  return Number(normalized) || 0;
}

function formatCurrencyValue(value) {
  const amount = Number(value || 0);
  return amount > 0 ? `$ ${new Intl.NumberFormat("es-CO").format(amount)}` : "";
}

function normalizeCurrencyValue(value) {
  return formatCurrencyValue(parseCurrency(value));
}

function sanitizeStatus(value, fallback = "nuevo") {
  const normalized = cleanText(value);
  return SERVICE_REQUEST_STATUSES.includes(normalized) ? normalized : fallback;
}

function sanitizePaymentStatus(value, fallback = "pendiente") {
  const normalized = cleanText(value);
  return SERVICE_PAYMENT_STATUSES.includes(normalized) ? normalized : fallback;
}

function normalizeDate(value = "") {
  const raw = cleanText(value);
  if (!raw) return "";
  const date = new Date(`${raw.slice(0, 10)}T00:00:00-05:00`);
  if (Number.isNaN(date.getTime())) return "";
  return raw.slice(0, 10);
}

function randomId() {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function getServiceRequestStore() {
  return getStore(SERVICE_STORE_NAME);
}

export function createServiceReference(now = new Date()) {
  const datePart = now.toISOString().slice(0, 10).replace(/-/g, "");
  const unique = randomId().replace(/-/g, "").slice(0, 6).toUpperCase();
  return `CONTARAE-SOL-${datePart}-${unique}`;
}

export function getServiceDocumentDownloadPath(reference, blobKey) {
  return `/api/admin-download-service-request-document?reference=${encodeURIComponent(normalizeReference(reference))}&key=${encodeURIComponent(String(blobKey || ""))}`;
}

export function buildServiceRequestDetail(record = {}) {
  const agreedPriceAmount = parseCurrency(record.agreedPrice);
  const amountPaidAmount = parseCurrency(record.amountPaid);
  const balanceAmount = Math.max(agreedPriceAmount - amountPaidAmount, 0);

  const documents = (Array.isArray(record.documents) ? record.documents : []).map((document) => ({
    ...document,
    downloadPath: document?.blobKey ? getServiceDocumentDownloadPath(record.reference, document.blobKey) : "",
    sizeLabel: formatBytes(document?.size)
  }));

  return {
    ...record,
    documents,
    financials: {
      agreedPriceAmount,
      amountPaidAmount,
      balanceAmount,
      balance: formatCurrencyValue(balanceAmount)
    }
  };
}

export function summarizeServiceRequest(record = {}) {
  const detail = buildServiceRequestDetail(record);
  return {
    reference: detail.reference || "",
    title: detail.title || "",
    serviceType: detail.serviceType || DEFAULT_SERVICE_TYPE,
    status: detail.status || "nuevo",
    paymentStatus: detail.paymentStatus || "pendiente",
    dueDate: detail.dueDate || "",
    agreedPrice: detail.agreedPrice || "",
    amountPaid: detail.amountPaid || "",
    balance: detail.financials?.balance || "",
    clientName: detail.client?.name || "",
    clientDocumentNumber: detail.client?.documentNumber || "",
    clientEmail: detail.client?.email || "",
    clientPhone: detail.client?.phone || "",
    documentsCount: detail.documents?.length || 0,
    createdAt: detail.createdAt || "",
    updatedAt: detail.updatedAt || ""
  };
}

export function sanitizeServiceRequestInput(input = {}, existing = {}) {
  const now = new Date().toISOString();
  const reference = normalizeReference(input.reference || existing.reference) || createServiceReference();
  const clientInput = input.client || {};
  const existingClient = existing.client || {};
  const agreedPrice = normalizeCurrencyValue(input.agreedPrice ?? existing.agreedPrice);
  const amountPaid = normalizeCurrencyValue(input.amountPaid ?? existing.amountPaid);

  return {
    ...existing,
    reference,
    title: cleanText(input.title ?? existing.title),
    serviceType: cleanText(input.serviceType ?? existing.serviceType) || DEFAULT_SERVICE_TYPE,
    status: sanitizeStatus(input.status ?? existing.status),
    paymentStatus: sanitizePaymentStatus(input.paymentStatus ?? existing.paymentStatus),
    agreedPrice,
    amountPaid,
    dueDate: normalizeDate(input.dueDate ?? existing.dueDate),
    comments: cleanText(input.comments ?? existing.comments),
    client: {
      name: cleanText(clientInput.name ?? existingClient.name),
      documentType: cleanText(clientInput.documentType ?? existingClient.documentType) || "CC",
      documentNumber: normalizeDocumentNumber(clientInput.documentNumber ?? existingClient.documentNumber),
      phone: cleanText(clientInput.phone ?? existingClient.phone),
      email: cleanText(clientInput.email ?? existingClient.email).toLowerCase()
    },
    documents: Array.isArray(existing.documents) ? existing.documents : [],
    createdAt: existing.createdAt || now,
    createdBy: existing.createdBy || cleanText(input.actor) || "admin",
    updatedAt: now,
    updatedBy: cleanText(input.actor) || existing.updatedBy || "admin"
  };
}

export async function listAllServiceRequests() {
  const store = getServiceRequestStore();
  const list = await store.list({ prefix: SERVICE_REQUEST_PREFIX });
  const records = await Promise.all(
    (list.blobs || []).map(async ({ key }) => {
      const record = await store.get(key, { type: "json" });
      return record ? summarizeServiceRequest(record) : null;
    })
  );

  return records.filter(Boolean).sort((left, right) => {
    return new Date(left.dueDate || left.updatedAt || left.createdAt || 0) -
      new Date(right.dueDate || right.updatedAt || right.createdAt || 0);
  });
}

export async function getServiceRequestByReference(reference) {
  const normalizedReference = normalizeReference(reference);
  if (!normalizedReference) return null;

  const store = getServiceRequestStore();
  const record = await store.get(`${SERVICE_REQUEST_PREFIX}${normalizedReference}`, { type: "json" });

  return record ? buildServiceRequestDetail(record) : null;
}

export async function upsertServiceRequest(input = {}, actor = "admin") {
  const store = getServiceRequestStore();
  const reference = normalizeReference(input.reference);
  const existing = reference
    ? await store.get(`${SERVICE_REQUEST_PREFIX}${reference}`, { type: "json" })
    : null;

  const record = sanitizeServiceRequestInput({ ...input, actor }, existing || {});
  await store.setJSON(`${SERVICE_REQUEST_PREFIX}${record.reference}`, record);

  return buildServiceRequestDetail(record);
}

function buildServiceDocumentBlobKey(reference, originalName) {
  const normalizedReference = normalizeReference(reference);
  const fileName = sanitizeFileName(originalName);
  return `${SERVICE_DOCUMENT_PREFIX}/${normalizedReference}/${randomId()}-${fileName}`;
}

function buildServiceDocumentRecord({
  reference,
  blobKey,
  originalName,
  contentType,
  size,
  uploadedAt,
  uploadedBy
}) {
  return {
    id: randomId(),
    reference: normalizeReference(reference),
    blobKey,
    originalName: sanitizeFileName(originalName),
    contentType: normalizeContentType(contentType, originalName),
    size: Number(size || 0),
    uploadedAt: uploadedAt || new Date().toISOString(),
    uploadedBy: cleanText(uploadedBy) || "admin"
  };
}

export async function uploadServiceRequestDocuments(reference, files = [], actor = "admin") {
  const normalizedReference = normalizeReference(reference);
  if (!normalizedReference) throw new Error("Falta la referencia de la solicitud.");
  if (!files.length) throw new Error("No seleccionaste documentos para cargar.");
  if (files.length > MAX_SERVICE_DOCUMENTS_PER_UPLOAD) {
    throw new Error(`Solo puedes adjuntar hasta ${MAX_SERVICE_DOCUMENTS_PER_UPLOAD} documentos por carga.`);
  }

  const store = getServiceRequestStore();
  const record = await store.get(`${SERVICE_REQUEST_PREFIX}${normalizedReference}`, { type: "json" });
  if (!record) throw new Error("Solicitud no encontrada.");

  const uploaded = [];

  for (const file of files) {
    const contentType = normalizeContentType(file.type, file.name);

    if (!isAllowedSupportContentType(contentType, file.name)) {
      throw new Error(`El archivo "${file.name}" no tiene un formato permitido. Usa PDF, JPG, PNG, WEBP, HEIC, DOC o DOCX.`);
    }

    if (Number(file.size || 0) > MAX_SERVICE_DOCUMENT_SIZE) {
      throw new Error(`El archivo "${file.name}" supera el límite de ${formatBytes(MAX_SERVICE_DOCUMENT_SIZE)}.`);
    }

    const blobKey = buildServiceDocumentBlobKey(normalizedReference, file.name);
    const uploadedAt = new Date().toISOString();

    await store.set(blobKey, await file.arrayBuffer(), {
      metadata: {
        reference: normalizedReference,
        originalName: file.name,
        contentType,
        size: Number(file.size || 0),
        uploadedAt,
        uploadedBy: actor
      }
    });

    uploaded.push(
      buildServiceDocumentRecord({
        reference: normalizedReference,
        blobKey,
        originalName: file.name,
        contentType,
        size: file.size,
        uploadedAt,
        uploadedBy: actor
      })
    );
  }

  const updated = {
    ...record,
    documents: [...(Array.isArray(record.documents) ? record.documents : []), ...uploaded],
    updatedAt: new Date().toISOString(),
    updatedBy: actor
  };

  await store.setJSON(`${SERVICE_REQUEST_PREFIX}${normalizedReference}`, updated);

  return {
    detail: buildServiceRequestDetail(updated),
    uploadedCount: uploaded.length
  };
}

export async function getServiceRequestDocument(reference, key) {
  const normalizedReference = normalizeReference(reference);
  const blobKey = String(key || "");

  if (!normalizedReference || !blobKey) {
    throw new Error("Faltan parámetros para descargar el documento.");
  }

  if (!blobKey.startsWith(`${SERVICE_DOCUMENT_PREFIX}/${normalizedReference}/`)) {
    throw new Error("Ruta de documento inválida.");
  }

  const store = getServiceRequestStore();
  const blob = await store.getWithMetadata(blobKey, { type: "arrayBuffer" });

  if (!blob) {
    return null;
  }

  return {
    data: blob.data,
    metadata: {
      contentType: String(blob.metadata?.contentType || "application/octet-stream"),
      originalName: sanitizeFileName(String(blob.metadata?.originalName || blobKey.split("/").pop() || "documento"))
    }
  };
}
