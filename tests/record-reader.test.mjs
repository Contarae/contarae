import assert from 'node:assert/strict';
import { test } from 'node:test';
import { installBlobMock } from './helpers/blob-store.mjs';
const blobs = installBlobMock();
const { createRecordReader } = await import('../netlify/functions/utils/record-reader.js');

test('repeated lookups reuse unchanged records and observe updates, additions and deletions', async () => {
  const read = createRecordReader();
  const store = blobs.getStore('source');
  for (let i = 0; i < 100; i++) await store.setJSON(`record:${i}`, { id: i, amount: i });
  const options = { getStoreImpl: blobs.getStore };
  const first = await read('source', 'record:', options);
  first[0].amount = -999;
  const second = await read('source', 'record:', options);
  assert.equal(second[0].amount, 0);
  assert.equal(blobs.calls.filter(x => x.op === 'getWithMetadata').length, 100);
  await store.setJSON('record:0', { id: 0, amount: 500 });
  await store.setJSON('record:100', { id: 100, amount: 10 });
  await store.delete('record:1');
  const third = await read('source', 'record:', options);
  assert.equal(third.length, 100);
  assert.equal(third.find(x => x.id === 0).amount, 500);
  assert.equal(third.find(x => x.id === 1), undefined);
  assert.equal(blobs.calls.filter(x => x.op === 'getWithMetadata').length, 102);
});

test('cache is bounded and never substitutes stale records on storage failure', async () => {
  const read = createRecordReader({ maxBytes: 1 });
  const store = blobs.getStore('bounded');
  await store.setJSON('item', { value: 1 });
  await read('bounded', '', { getStoreImpl: blobs.getStore });
  await assert.rejects(read('bounded', '', { getStoreImpl: name => ({ ...blobs.getStore(name), getWithMetadata: async () => { throw new Error('unavailable'); } }) }), /unavailable/);
});
