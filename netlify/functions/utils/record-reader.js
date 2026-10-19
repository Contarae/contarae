import { getStore } from "@netlify/blobs";

// Only server memory is cached. Every call checks a fresh, strongly consistent listing.
export function createRecordReader({ maxBytes = 16 * 1024 * 1024, maxEntries = 1000, ttlMs = 300000 } = {}) {
  const cache = new Map();
  let cachedBytes = 0;
  const remove = key => {
    const entry = cache.get(key);
    if (entry) cachedBytes -= entry.bytes;
    cache.delete(key);
  };
  return async function readRecords(storeName, prefix, { getStoreImpl = getStore } = {}) {
    const now = Date.now();
    for (const [key, entry] of cache) if (now - entry.at > ttlMs) remove(key);
    const store = getStoreImpl(storeName, { consistency: "strong" });
    const { blobs = [] } = await store.list({ prefix });
    const records = new Array(blobs.length);
    let next = 0;
    await Promise.all(Array.from({ length: Math.min(8, blobs.length) }, async () => {
      while (next < blobs.length) {
        const index = next++;
        const { key, etag } = blobs[index];
        const cacheKey = JSON.stringify([storeName, key]);
        const entry = cache.get(cacheKey);
        if (etag && entry?.etag === etag) {
          records[index] = JSON.parse(entry.json);
          continue;
        }
        remove(cacheKey);
        const result = await store.getWithMetadata(key, { type: "json", consistency: "strong" });
        if (!result) { records[index] = null; continue; }
        records[index] = result.data;
        const json = JSON.stringify(result.data);
        const bytes = Buffer.byteLength(json);
        if (!result.etag || bytes > maxBytes) continue;
        while (cache.size && (cachedBytes + bytes > maxBytes || cache.size >= maxEntries)) remove(cache.keys().next().value);
        // Another concurrent read may have completed while this read was in flight.
        remove(cacheKey);
        cache.set(cacheKey, { etag: result.etag, json, bytes, at: now });
        cachedBytes += bytes;
      }
    }));
    return records.filter(Boolean);
  };
}

export const readStoreRecords = createRecordReader();
