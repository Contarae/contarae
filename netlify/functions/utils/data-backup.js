import crypto from "crypto";
import { getStore } from "@netlify/blobs";

export const STRUCTURED_BACKUP_STORES = [
  "certification-requests",
  "service-requests",
  "client-leads",
  "client-portal",
  "promo-codes",
  "security-audit"
];

export const BACKUP_STORE_NAME = "contarae-backups";
export const BACKUP_PREFIX = "daily/";
export const BACKUP_MANIFEST_KEY = "manifest/latest.json";
export const DEFAULT_RETENTION_DAYS = 30;
const DAILY_BACKUP_KEY = /^daily\/\d{4}-\d{2}-\d{2}(?:-\d+-[a-f0-9-]+)?\.json$/;

function isoDate(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function isStructuredKey(key = "") {
  return Boolean(key) && !String(key).includes("/");
}

function isFileBlobKey(key = "") {
  return Boolean(key) && String(key).includes("/");
}

function keyHash(key = "") {
  return crypto.createHash("sha256").update(String(key)).digest("hex").slice(0, 16);
}

function fileCategoryForKey(key = "") {
  const [category = "unknown"] = String(key || "").split("/");
  return category || "unknown";
}

async function runWithConcurrency(items, limit, mapper) {
  const results = new Array(items.length);
  let nextIndex = 0;
  const workerCount = Math.max(1, Math.min(Number(limit || 1), items.length || 1));

  await Promise.all(
    Array.from({ length: workerCount }, async () => {
      while (nextIndex < items.length) {
        const index = nextIndex;
        nextIndex += 1;
        results[index] = await mapper(items[index], index);
      }
    })
  );

  return results;
}

export async function collectStructuredStoreBackup(storeName, options = {}) {
  const {
    getStoreImpl = getStore,
    concurrency = 10,
    listing
  } = options;
  const store = getStoreImpl(storeName, { consistency: "strong" });
  const list = listing || await store.list();
  const keys = (list.blobs || [])
    .map((blob) => blob.key)
    .filter(isStructuredKey)
    .sort();
  const skipped = [];
  const records = {};

  await runWithConcurrency(keys, concurrency, async (key) => {
    try {
      const stored = await store.getWithMetadata(key, {
        type: "json",
        consistency: "strong"
      });
      if (!stored) {
        skipped.push({ keyHash: keyHash(key), reason: "not_found" });
        return;
      }
      records[key] = {
        etag: stored.etag || "",
        metadata: stored.metadata || {},
        data: stored.data
      };
    } catch (error) {
      skipped.push({
        keyHash: keyHash(key),
        reason: String(error?.name || error?.message || "read_error").slice(0, 120)
      });
    }
  });

  return {
    storeName,
    scanned: (list.blobs || []).length,
    included: Object.keys(records).length,
    skipped: skipped.length,
    skippedItems: skipped,
    records
  };
}

export async function collectFileInventory(storeName, options = {}) {
  const {
    getStoreImpl = getStore,
    concurrency = 10,
    listing
  } = options;
  const store = getStoreImpl(storeName, { consistency: "strong" });
  const list = listing || await store.list();
  const listedByKey = new Map((list.blobs || []).map(blob => [blob.key, blob]));
  const keys = (list.blobs || [])
    .map((blob) => blob.key)
    .filter(isFileBlobKey)
    .sort();
  const skipped = [];
  const files = [];

  await runWithConcurrency(keys, concurrency, async (key) => {
    const listedBlob = listedByKey.get(key) || {};

    try {
      const metadataResult = typeof store.getMetadata === "function"
        ? await store.getMetadata(key, { consistency: "strong" })
        : null;
      files.push({
        key,
        keyHash: keyHash(key),
        category: fileCategoryForKey(key),
        etag: metadataResult?.etag || listedBlob.etag || "",
        metadata: metadataResult?.metadata || {}
      });
    } catch (error) {
      files.push({
        key,
        keyHash: keyHash(key),
        category: fileCategoryForKey(key),
        etag: listedBlob.etag || "",
        metadata: {}
      });
      skipped.push({
        keyHash: keyHash(key),
        reason: String(error?.name || error?.message || "metadata_read_error").slice(0, 120)
      });
    }
  });

  const categories = files.reduce((acc, file) => {
    acc[file.category] = (acc[file.category] || 0) + 1;
    return acc;
  }, {});

  return {
    storeName,
    scanned: (list.blobs || []).length,
    included: files.length,
    skipped: skipped.length,
    skippedItems: skipped,
    categories,
    files
  };
}

export function verifyBackupPayload(backup, expectedHash = backup?.integrity?.sha256) {
  if (!backup || !expectedHash) return false;
  const { integrity, ...payload } = backup;
  return crypto.createHash("sha256").update(JSON.stringify(payload)).digest("hex") === expectedHash;
}

async function copyFileBlobs(storeName, files, backupStore, previousFiles, getStoreImpl) {
  const source = getStoreImpl(storeName);
  const previousByKey = new Map(previousFiles.map(file => [file.key, file]));
  return runWithConcurrency(files, 2, async file => {
    const previous = previousByKey.get(file.key);
    if (file.etag && previous?.etag === file.etag && previous.backupKey && previous.sha256) {
      const saved = await backupStore.getMetadata(previous.backupKey, { consistency: "strong" });
      if (saved?.metadata?.sha256 === previous.sha256) {
        return { ...file, backupKey: previous.backupKey, sha256: previous.sha256, size: previous.size };
      }
    }
    const stored = await source.getWithMetadata(file.key, { type: "arrayBuffer", consistency: "strong" });
    if (!stored) throw new Error("A source file disappeared during backup.");
    const bytes = Buffer.from(stored.data);
    const sha256 = crypto.createHash("sha256").update(bytes).digest("hex");
    const backupKey = `files/${sha256}`;
    const existing = await backupStore.getMetadata(backupKey, { consistency: "strong" });
    if (!existing) {
      await backupStore.set(backupKey, bytes, { onlyIfNew: true, metadata: { sha256, size: bytes.length } });
    }
    const copy = await backupStore.get(backupKey, { type: "arrayBuffer", consistency: "strong" });
    if (!copy || crypto.createHash("sha256").update(Buffer.from(copy)).digest("hex") !== sha256) {
      throw new Error("File backup integrity check failed.");
    }
    return { ...file, metadata: stored.metadata || {}, etag: stored.etag || "", backupKey, sha256, size: bytes.length };
  });
}

async function pruneOldBackups(backupStore, retentionDays = DEFAULT_RETENTION_DAYS) {
  const list = await backupStore.list({ prefix: BACKUP_PREFIX });
  const keys = (list.blobs || [])
    .map((blob) => blob.key)
    .filter((key) => DAILY_BACKUP_KEY.test(key))
    .sort()
    .reverse();
  const retained = Math.max(1, Number(retentionDays || DEFAULT_RETENTION_DAYS));
  const removable = keys.slice(retained);

  await Promise.all(removable.map((key) => backupStore.delete(key)));

  return {
    retained: keys.length - removable.length,
    deleted: removable.length
  };
}

export async function createStructuredDataBackup(options = {}) {
  const {
    date = new Date(),
    sourceStores = STRUCTURED_BACKUP_STORES,
    getStoreImpl = getStore,
    retentionDays = DEFAULT_RETENTION_DAYS,
    concurrency = 10
  } = options;
  const generatedAt = date.toISOString();
  const backupKey = `${BACKUP_PREFIX}${isoDate(date)}-${date.getTime()}-${crypto.randomUUID()}.json`;
  const stores = {};
  const fileInventories = {};
  const summary = {};
  const backupStore = getStoreImpl(BACKUP_STORE_NAME);
  const previousManifest = typeof backupStore.get === "function"
    ? await backupStore.get(BACKUP_MANIFEST_KEY, { type: "json", consistency: "strong" })
    : null;

  for (const storeName of sourceStores) {
    const listing = await getStoreImpl(storeName, { consistency: "strong" }).list();
    const result = await collectStructuredStoreBackup(storeName, {
      getStoreImpl,
      concurrency,
      listing
    });
    const fileInventory = await collectFileInventory(storeName, {
      getStoreImpl,
      concurrency,
      listing
    });
    if (result.skipped || fileInventory.skipped) {
      throw new Error(`Incomplete backup for ${storeName}; the last successful backup was preserved.`);
    }
    stores[storeName] = result.records;
    fileInventories[storeName] = await copyFileBlobs(storeName, fileInventory.files, backupStore, previousManifest?.fileInventories?.[storeName] || [], getStoreImpl);
    summary[storeName] = {
      scanned: result.scanned,
      included: result.included,
      skipped: result.skipped,
      skippedItems: result.skippedItems,
      files: {
        included: fileInventory.included,
        skipped: fileInventory.skipped,
        skippedItems: fileInventory.skippedItems,
        categories: fileInventory.categories
      }
    };
  }

  const payload = {
    version: 2,
    generatedAt,
    sourceStores,
    scope: "structured-json-records-and-file-copies",
    note: "File contents are stored once by SHA-256 in the backup store. File copies are not automatically deleted. This is not a transactional snapshot or an off-provider backup.",
    summary,
    stores,
    fileInventories
  };
  const payloadJson = JSON.stringify(payload);
  const sha256 = crypto.createHash("sha256").update(payloadJson).digest("hex");
  const manifest = {
    version: 2,
    backupKey,
    generatedAt,
    sha256,
    sourceStores,
    scope: payload.scope,
    summary,
    retentionDays,
    fileInventories
  };

  const writeResult = await backupStore.setJSON(backupKey, {
    ...payload,
    integrity: { sha256 }
  }, {
    onlyIfNew: true,
    metadata: {
      generatedAt,
      sourceStores: sourceStores.join(","),
      scope: payload.scope,
      sha256
    }
  });
  if (!writeResult.modified) throw new Error("Backup key already exists; previous copy preserved.");
  const saved = await backupStore.get(backupKey, { type: "json", consistency: "strong" });
  if (!verifyBackupPayload(saved, sha256)) throw new Error("Backup read-back integrity check failed.");
  await backupStore.setJSON(BACKUP_MANIFEST_KEY, manifest, {
    metadata: {
      generatedAt,
      backupKey,
      sha256
    }
  });

  const retention = await pruneOldBackups(backupStore, retentionDays);

  return {
    ok: true,
    backupKey,
    generatedAt,
    sha256,
    summary,
    retention
  };
}

export async function getLatestBackupManifest(options = {}) {
  const { getStoreImpl = getStore } = options;
  const store = getStoreImpl(BACKUP_STORE_NAME);
  const manifest = await store.get(BACKUP_MANIFEST_KEY, { type: "json", consistency: "strong" });
  if (manifest) {
    const backup = await store.get(manifest.backupKey, { type: "json", consistency: "strong" });
    const { fileInventories, ...summaryManifest } = manifest;
    return { ...summaryManifest, integrityVerified: verifyBackupPayload(backup, manifest.sha256) };
  }

  const list = await store.list({ prefix: BACKUP_PREFIX });
  const latestKey = (list.blobs || [])
    .map((blob) => blob.key)
    .filter((key) => DAILY_BACKUP_KEY.test(key))
    .sort()
    .reverse()[0];
  if (!latestKey) return null;

  const backup = await store.get(latestKey, { type: "json" });
  return backup ? {
    version: 1,
    backupKey: latestKey,
    generatedAt: backup.generatedAt || "",
    sha256: backup.integrity?.sha256 || "",
    sourceStores: backup.sourceStores || [],
    scope: backup.scope || "",
    summary: backup.summary || {},
    integrityVerified: verifyBackupPayload(backup)
  } : null;
}
