import assert from 'node:assert/strict';
import { test } from 'node:test';
import { installBlobMock } from './helpers/blob-store.mjs';
const blobs = installBlobMock();
const { listSecurityEvents } = await import('../netlify/functions/utils/security-audit.js');
test('recent audit query uses date prefixes without deleting older history', async () => {
  const store = blobs.getStore('security-audit');
  for (const date of ['2020-01-01', '2026-10-17', '2026-10-18']) await store.setJSON(`event:${date}T12:00:00Z-id`, { id: date, type: 'test', createdAt: date });
  const events = await listSecurityEvents({ limit: 2, date: new Date('2026-10-18'), getStoreImpl: blobs.getStore });
  assert.deepEqual(events.map(x => x.id), ['2026-10-18', '2026-10-17']);
  assert.equal(blobs.calls.filter(x => x.op === 'list').length, 2);
  assert.equal(blobs.calls.some(x => x.op === 'delete'), false);
  assert.ok(await store.get('event:2020-01-01T12:00:00Z-id'));
});
