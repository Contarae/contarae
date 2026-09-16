import crypto from "crypto";
import { getStore } from "@netlify/blobs";

export const STRUCTURED_BACKUP_STORES = [
  "certification-requests",
  "service-requests",
  "client-leads",
  "client-portal",
  "promo-codes"
];

export const BACKUP_STORE_NAME = "contarae-backups";
export const BACKUP_PREFIX = "daily/";
export const DEFAULT_RETENTION_DAYS = 30;

function isoDate(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function isStructuredKey(key = "") {
  return Boolean(key) && !String(key).includes("/");
}

function keyHash(key = "") {
  return crypto.createHash("sha256").update(String(key)).digest("hex").slice(0, 16);
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
    concurrency = 10
  } = options;
  const store = getStoreImpl(storeName);
  const list = await store.list();
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

async function pruneOldBackups(backupStore, retentionDays = DEFAULT_RETENTION_DAYS) {
  const list = await backupStore.list({ prefix: BACKUP_PREFIX });
  const keys = (list.blobs || [])
    .map((blob) => blob.key)
    .filter((key) => /^daily\/\d{4}-\d{2}-\d{2}\.json$/.test(key))
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
  const backupKey = `${BACKUP_PREFIX}${isoDate(date)}.json`;
  const stores = {};
  const summary = {};

  for (const storeName of sourceStores) {
    const result = await collectStructuredStoreBackup(storeName, {
      getStoreImpl,
      concurrency
    });
    stores[storeName] = result.records;
    summary[storeName] = {
      scanned: result.scanned,
      included: result.included,
      skipped: result.skipped,
      skippedItems: result.skippedItems
    };
  }

  const payload = {
    version: 1,
    generatedAt,
    sourceStores,
    scope: "structured-json-records",
    note: "This backup excludes binary/file blobs such as uploaded support documents and issued PDFs.",
    summary,
    stores
  };

  const backupStore = getStoreImpl(BACKUP_STORE_NAME);
  await backupStore.setJSON(backupKey, payload, {
    metadata: {
      generatedAt,
      sourceStores: sourceStores.join(","),
      scope: "structured-json-records"
    }
  });

  const retention = await pruneOldBackups(backupStore, retentionDays);

  return {
    ok: true,
    backupKey,
    generatedAt,
    summary,
    retention
  };
}
