const BLOB_VERSION = Symbol("contaraeBlobVersion");

export function attachBlobVersion(value, { etag = "", exists = true } = {}) {
  if (!value || typeof value !== "object") return value;
  Object.defineProperty(value, BLOB_VERSION, {
    configurable: true,
    enumerable: false,
    value: { etag: String(etag || ""), exists: Boolean(exists) },
    writable: true
  });
  return value;
}

export function getBlobWriteConditions(value) {
  const version = value?.[BLOB_VERSION];
  if (!version) return {};
  if (!version.exists) return { onlyIfNew: true };
  return version.etag ? { onlyIfMatch: version.etag } : {};
}

export function assertBlobWrite(result, message = "No fue posible guardar porque la información cambió en otra sesión. Recarga e inténtalo nuevamente.") {
  if (result?.modified !== false) return;
  const error = new Error(message);
  error.code = "storage_conflict";
  error.status = 409;
  throw error;
}
