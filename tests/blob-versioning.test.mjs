import assert from "node:assert/strict";
import test from "node:test";
import {
  assertBlobWrite,
  attachBlobVersion,
  getBlobWriteConditions
} from "../netlify/functions/utils/blob-versioning.js";

test("getBlobWriteConditions uses the loaded etag for existing records", () => {
  const value = attachBlobVersion({ ok: true }, { etag: "etag-123", exists: true });
  assert.deepEqual(getBlobWriteConditions(value), { onlyIfMatch: "etag-123" });
});

test("getBlobWriteConditions protects brand-new records", () => {
  const value = attachBlobVersion({ ok: true }, { exists: false });
  assert.deepEqual(getBlobWriteConditions(value), { onlyIfNew: true });
});

test("assertBlobWrite throws a storage conflict when Netlify rejects a conditional write", () => {
  assert.throws(
    () => assertBlobWrite({ modified: false }),
    (error) => error.code === "storage_conflict" && error.status === 409
  );
});
