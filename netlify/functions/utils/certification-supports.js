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

function hasSuspiciousFileName(fileName = "") {
  const normalized = sanitizeFileName(fileName).toLowerCase();
  if (!normalized) return true;
  if (/\.(exe|bat|cmd|com|scr|js|mjs|cjs|html?|svg|php|phtml|sh|ps1|jar|app|dmg|pkg|zip|rar|7z)(\.|$)/i.test(normalized)) {
    return true;
  }
  const parts = normalized.split(".").filter(Boolean);
  return parts.length > 2 && parts.slice(0, -1).some((part) =>
    ["pdf", "jpg", "jpeg", "png", "webp", "doc", "docx"].includes(part)
  );
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

function bytesStartWith(bytes, signature = []) {
  return signature.every((value, index) => bytes[index] === value);
}

function bytesIncludeAscii(bytes, text, start = 0, end = bytes.length) {
  const value = Array.from(bytes.slice(start, end)).map((byte) => String.fromCharCode(byte)).join("");
  return value.includes(text);
}

export function hasExpectedFileSignature(bytes, contentType = "", fileName = "") {
  const normalizedType = normalizeContentType(contentType, fileName);
  const extension = getFileExtension(fileName);

  if (!bytes?.length) return false;
  if (normalizedType === "application/pdf" || extension === "pdf") return bytesStartWith(bytes, [0x25, 0x50, 0x44, 0x46]);
  if (normalizedType === "image/jpeg" || ["jpg", "jpeg"].includes(extension)) return bytesStartWith(bytes, [0xff, 0xd8, 0xff]);
  if (normalizedType === "image/png" || extension === "png") return bytesStartWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (normalizedType === "image/webp" || extension === "webp") {
    return bytesStartWith(bytes, [0x52, 0x49, 0x46, 0x46]) && bytesIncludeAscii(bytes, "WEBP", 8, 16);
  }
  if (normalizedType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || extension === "docx") {
    return bytesStartWith(bytes, [0x50, 0x4b, 0x03, 0x04]);
  }
  if (normalizedType === "application/msword" || extension === "doc") return bytesStartWith(bytes, [0xd0, 0xcf, 0x11, 0xe0]);
  if (["image/heic", "image/heif"].includes(normalizedType) || ["heic", "heif"].includes(extension)) return true;
  return false;
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

    if (hasSuspiciousFileName(file.name)) {
      throw new Error(
        `El archivo "${file.name}" tiene un nombre o extensión no permitida. Cambia el nombre y vuelve a cargarlo.`
      );
    }

    if (!isAllowedSupportContentType(contentType, file.name)) {
      throw new Error(
        `El archivo "${file.name}" no tiene un formato permitido. Usa PDF, JPG, PNG, WEBP, HEIC, DOC o DOCX.`
      );
    }

    if (Number(file.size || 0) > MAX_SUPPORT_FILE_SIZE) {
      throw new Error(`El archivo "${file.name}" supera el límite de ${formatBytes(MAX_SUPPORT_FILE_SIZE)}.`);
    }

    const buffer = await file.arrayBuffer();
    const signatureBytes = new Uint8Array(buffer.slice(0, 32));

    if (!hasExpectedFileSignature(signatureBytes, contentType, file.name)) {
      throw new Error(`El archivo "${file.name}" no parece coincidir con el formato indicado.`);
    }

    const blobKey = buildSupportBlobKey(normalizedReference, file.name);
    const uploadedAt = new Date().toISOString();

    await store.set(blobKey, buffer, {
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
