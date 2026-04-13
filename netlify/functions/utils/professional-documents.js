import { getStore } from "@netlify/blobs";
import {
  formatBytes,
  sanitizeFileName
} from "./certification-supports.js";

const PROFESSIONAL_DOCUMENT_TYPES = {
  professional_card: {
    label: "Copia de tarjeta profesional",
    metaKey: "meta:professional-document:professional_card"
  },
  jcc_background: {
    label: "Antecedentes Junta Central de Contadores",
    metaKey: "meta:professional-document:jcc_background"
  }
};

const ALLOWED_CONTENT_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp"
]);

const MAX_DOCUMENT_SIZE = 8 * 1024 * 1024;

function buildDocumentBlobKey(type, fileName) {
  return `meta/professional-documents/${type}/${Date.now()}-${sanitizeFileName(fileName)}`;
}

export function getProfessionalStore() {
  return getStore("certification-requests");
}

export function getProfessionalProfile() {
  return {
    accountantName: process.env.ACCOUNTANT_FULL_NAME || "Diego Ramirez",
    professionalCardNumber: process.env.ACCOUNTANT_PROFESSIONAL_CARD || "",
    accountantDocumentNumber: process.env.ACCOUNTANT_CC || "",
    title: process.env.ACCOUNTANT_TITLE || "Contador Público",
    city: process.env.ACCOUNTANT_CITY || "Bogotá D.C.",
    companyName: process.env.CERTIFICATION_COMPANY_NAME || "CONTARAE"
  };
}

function normalizeContentType(contentType = "", fileName = "") {
  const type = String(contentType || "").trim().toLowerCase();
  if (type) return type;
  if (String(fileName || "").toLowerCase().endsWith(".pdf")) return "application/pdf";
  if (String(fileName || "").toLowerCase().match(/\.(jpg|jpeg)$/)) return "image/jpeg";
  if (String(fileName || "").toLowerCase().endsWith(".png")) return "image/png";
  if (String(fileName || "").toLowerCase().endsWith(".webp")) return "image/webp";
  return "application/octet-stream";
}

export async function getProfessionalDocumentsStatus(store = getProfessionalStore()) {
  const profile = getProfessionalProfile();
  const results = await Promise.all(
    Object.entries(PROFESSIONAL_DOCUMENT_TYPES).map(async ([type, config]) => {
      const meta = await store.get(config.metaKey, { type: "json" });
      return [type, meta || null];
    })
  );

  return {
    profile,
    documents: Object.fromEntries(
      results.map(([type, meta]) => [
        type,
        {
          type,
          label: PROFESSIONAL_DOCUMENT_TYPES[type].label,
          available: Boolean(meta?.blobKey),
          fileName: meta?.fileName || "",
          contentType: meta?.contentType || "",
          size: meta?.size || 0,
          sizeLabel: meta?.size ? formatBytes(meta.size) : "",
          uploadedAt: meta?.uploadedAt || "",
          uploadedBy: meta?.uploadedBy || "",
          downloadPath: meta?.blobKey ? `/api/admin-download-professional-document?type=${encodeURIComponent(type)}` : ""
        }
      ])
    )
  };
}

export async function uploadProfessionalDocument({
  type,
  file,
  actor,
  store = getProfessionalStore()
}) {
  const config = PROFESSIONAL_DOCUMENT_TYPES[type];
  if (!config) {
    throw new Error("Tipo de documento profesional no válido.");
  }

  if (!file || typeof file.arrayBuffer !== "function") {
    throw new Error("No se recibió un archivo válido.");
  }

  const contentType = normalizeContentType(file.type, file.name);
  if (!ALLOWED_CONTENT_TYPES.has(contentType)) {
    throw new Error("Solo se permiten archivos PDF, JPG, PNG o WEBP.");
  }

  if (Number(file.size || 0) > MAX_DOCUMENT_SIZE) {
    throw new Error(`El archivo supera el límite de ${formatBytes(MAX_DOCUMENT_SIZE)}.`);
  }

  const blobKey = buildDocumentBlobKey(type, file.name);
  const uploadedAt = new Date().toISOString();

  await store.set(blobKey, await file.arrayBuffer(), {
    metadata: {
      type,
      fileName: file.name,
      contentType,
      size: Number(file.size || 0),
      uploadedAt,
      uploadedBy: actor || ""
    }
  });

  const meta = {
    type,
    label: config.label,
    blobKey,
    fileName: sanitizeFileName(file.name),
    contentType,
    size: Number(file.size || 0),
    uploadedAt,
    uploadedBy: actor || ""
  };

  await store.setJSON(config.metaKey, meta);

  return meta;
}

export async function getProfessionalDocumentBlob(type, store = getProfessionalStore()) {
  const config = PROFESSIONAL_DOCUMENT_TYPES[type];
  if (!config) {
    throw new Error("Tipo de documento profesional no válido.");
  }

  const meta = await store.get(config.metaKey, { type: "json" });
  if (!meta?.blobKey) return null;

  const blob = await store.getWithMetadata(meta.blobKey, { type: "arrayBuffer" });
  if (!blob) return null;

  return {
    meta,
    data: blob.data,
    metadata: blob.metadata || {}
  };
}

export function listProfessionalDocumentTypes() {
  return Object.keys(PROFESSIONAL_DOCUMENT_TYPES);
}
