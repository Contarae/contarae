import assert from "node:assert/strict";
import test from "node:test";
import {
  BACKUP_MANIFEST_KEY,
  BACKUP_STORE_NAME,
  collectFileInventory,
  collectStructuredStoreBackup,
  createStructuredDataBackup
} from "../netlify/functions/utils/data-backup.js";

function createMockStores(seed = {}) {
  const stores = new Map(
    Object.entries(seed).map(([storeName, values]) => [
      storeName,
      new Map(
        Object.entries(values).map(([key, data]) => [
          key,
          {
            data,
            etag: `etag:${storeName}:${key}`,
            metadata: {}
          }
        ])
      )
    ])
  );

  const getStoreImpl = (storeName) => {
    if (!stores.has(storeName)) stores.set(storeName, new Map());
    const values = stores.get(storeName);
    return {
      async list({ prefix = "" } = {}) {
        return {
          blobs: [...values.keys()]
            .filter((key) => String(key).startsWith(prefix))
            .map((key) => ({ key }))
        };
      },
      async getWithMetadata(key) {
        return values.get(key) || null;
      },
      async getMetadata(key) {
        const value = values.get(key);
        if (!value) return null;
        return {
          etag: value.etag,
          metadata: value.metadata || {}
        };
      },
      async setJSON(key, data, options = {}) {
        values.set(key, {
          data,
          etag: `etag:${storeName}:${key}:new`,
          metadata: options.metadata || {}
        });
        return { modified: true, etag: `etag:${storeName}:${key}:new` };
      },
      async delete(key) {
        values.delete(key);
      }
    };
  };

  return { getStoreImpl, stores };
}

test("collectStructuredStoreBackup includes JSON records and skips file blobs", async () => {
  const { getStoreImpl } = createMockStores({
    "certification-requests": {
      "pending:ABC": { status: "pending" },
      "paid:ABC": { status: "approved" },
      "supports/ABC/file.pdf": { binary: true }
    }
  });

  const backup = await collectStructuredStoreBackup("certification-requests", {
    getStoreImpl
  });

  assert.equal(backup.scanned, 3);
  assert.equal(backup.included, 2);
  assert.deepEqual(Object.keys(backup.records).sort(), ["paid:ABC", "pending:ABC"]);
});

test("collectFileInventory records file blobs without reading file contents", async () => {
  const { getStoreImpl } = createMockStores({
    "certification-requests": {
      "pending:ABC": { status: "pending" },
      "supports/ABC/file.pdf": { binary: true },
      "issued/ABC/certificate.pdf": { binary: true }
    }
  });

  const inventory = await collectFileInventory("certification-requests", {
    getStoreImpl
  });

  assert.equal(inventory.scanned, 3);
  assert.equal(inventory.included, 2);
  assert.deepEqual(inventory.categories, { issued: 1, supports: 1 });
  assert.equal(inventory.files.every((file) => file.key && file.keyHash && file.etag), true);
});

test("createStructuredDataBackup stores one private daily backup and prunes old backups", async () => {
  const { getStoreImpl, stores } = createMockStores({
    "source-store": {
      "record:1": { ok: true }
    },
    [BACKUP_STORE_NAME]: {
      "daily/2026-09-14.json": { old: true },
      "daily/2026-09-15.json": { newer: true }
    }
  });

  const result = await createStructuredDataBackup({
    date: new Date("2026-09-16T05:00:00.000Z"),
    sourceStores: ["source-store"],
    getStoreImpl,
    retentionDays: 2
  });

  const backupStore = stores.get(BACKUP_STORE_NAME);
  assert.equal(result.backupKey, "daily/2026-09-16.json");
  assert.equal(backupStore.has("daily/2026-09-16.json"), true);
  assert.equal(backupStore.has(BACKUP_MANIFEST_KEY), true);
  assert.equal(backupStore.has("daily/2026-09-15.json"), true);
  assert.equal(backupStore.has("daily/2026-09-14.json"), false);
  assert.match(result.sha256, /^[a-f0-9]{64}$/);
  assert.equal(backupStore.get(BACKUP_MANIFEST_KEY).data.sha256, result.sha256);
  assert.deepEqual(backupStore.get("daily/2026-09-16.json").data.fileInventories, {
    "source-store": []
  });
  assert.equal(backupStore.get("daily/2026-09-16.json").data.integrity.sha256, result.sha256);
});
