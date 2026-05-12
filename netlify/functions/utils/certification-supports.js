import crypto from "crypto";

export const MAX_SUPPORT_FILES = 5;
export const MAX_SUPPORT_FILE_SIZE = 6 * 1024 * 1024;

export const ALLOWED_SUPPORT_CONTENT_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
]);

const CONTENT_TYPE_BY_EXTENSION = {
  pdf: "application/pdf",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  heic: "image/heic",
  heif: "image/heif",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
};

export function normalizeReference(value = "") {
  return String(value || "")
    .trim()
    .replace(/[^A-Za-z0-9_-]/g, "");
}

export function sanitizeFileName(value = "") {
  const sanitized = String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9._ -]/g, "")
    .trim()
    .replace(/\s+/g, "-");

  return sanitized || "soporte";
}

export function getFileExtension(fileName = "") {
  const parts = String(fileName || "").toLowerCase().split(".");
  return parts.length > 1 ? parts.pop() : "";
}

export function normalizeContentType(contentType = "", fileName = "") {
  const trimmed = String(contentType || "").trim().toLowerCase();
  if (trimmed) return trimmed;
  return CONTENT_TYPE_BY_EXTENSION[getFileExtension(fileName)] || "application/octet-stream";
}

export function isAllowedSupportContentType(contentType = "", fileName = "") {
  const normalized = normalizeContentType(contentType, fileName);
  return ALLOWED_SUPPORT_CONTENT_TYPES.has(normalized);
}

export function formatBytes(bytes = 0) {
  const value = Number(bytes || 0);
  if (!Number.isFinite(value) || value <= 0) return "0 B";
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

export function buildSupportBlobKey(reference, originalName) {
  const normalizedReference = normalizeReference(reference);
  const fileName = sanitizeFileName(originalName);
  const uniqueId =
    typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  return `supports/${normalizedReference}/${uniqueId}-${fileName}`;
}

export function buildIssuedCertificateBlobKey(reference, version, originalName) {
  const normalizedReference = normalizeReference(reference);
  const fileName = sanitizeFileName(originalName || `certificado-v${version}.pdf`);
  const safeVersion = Math.max(1, Number(version || 1));
  const uniqueId =
    typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  return `issued/${normalizedReference}/v${safeVersion}-${uniqueId}-${fileName}`;
}

export function buildSupportRecord({
  reference,
  blobKey,
  originalName,
  contentType,
  size,
  uploadedAt
}) {
  return {
    id:
      typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    reference: normalizeReference(reference),
    blobKey,
    originalName: sanitizeFileName(originalName),
    contentType: normalizeContentType(contentType, originalName),
    size: Number(size || 0),
    uploadedAt: uploadedAt || new Date().toISOString()
  };
}

export function getSupportDownloadPath(reference, blobKey) {
  const normalizedReference = encodeURIComponent(normalizeReference(reference));
  const normalizedKey = encodeURIComponent(String(blobKey || ""));
  return `/api/admin-download-certification-support?reference=${normalizedReference}&key=${normalizedKey}`;
}

export function getIssuedCertificateDownloadPath(reference, blobKey) {
  const normalizedReference = encodeURIComponent(normalizeReference(reference));
  const normalizedKey = encodeURIComponent(String(blobKey || ""));
  return `/api/admin-download-certification-issued?reference=${normalizedReference}&key=${normalizedKey}`;
}

export async function uploadIncomingSupportFiles(store, reference, files = []) {
  const normalizedReference = normalizeReference(reference);
  const uploadedFiles = [];

  if (!normalizedReference) {
    throw new Error("Falta la referencia de la solicitud.");
  }

  if (!files.length) {
    return uploadedFiles;
  }

  if (files.length > MAX_SUPPORT_FILES) {
    throw new Error(`Solo puedes adjuntar hasta ${MAX_SUPPORT_FILES} archivos por solicitud.`);
  }

  for (const file of files) {
    const contentType = String(file.type || "").trim().toLowerCase();

    if (!isAllowedSupportContentType(contentType, file.name)) {
      throw new Error(
        `El archivo "${file.name}" no tiene un formato permitido. Usa PDF, JPG, PNG, WEBP, HEIC, DOC o DOCX.`
      );
    }

    if (Number(file.size || 0) > MAX_SUPPORT_FILE_SIZE) {
      throw new Error(`El archivo "${file.name}" supera el límite de ${formatBytes(MAX_SUPPORT_FILE_SIZE)}.`);
    }

    const blobKey = buildSupportBlobKey(normalizedReference, file.name);
    const uploadedAt = new Date().toISOString();

    await store.set(blobKey, await file.arrayBuffer(), {
      metadata: {
        reference: normalizedReference,
        originalName: file.name,
        contentType,
        size: Number(file.size || 0),
        uploadedAt
      }
    });

    uploadedFiles.push(
      buildSupportRecord({
        reference: normalizedReference,
        blobKey,
        originalName: file.name,
        contentType,
        size: file.size,
        uploadedAt
      })
    );
  }

  return uploadedFiles;
}
