import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';
import crypto from 'node:crypto';
import { installBlobMock } from './helpers/blob-store.mjs';
const blobs = installBlobMock();
const { createStructuredDataBackup, getLatestBackupManifest, verifyBackupPayload, BACKUP_STORE_NAME, BACKUP_MANIFEST_KEY } = await import('../netlify/functions/utils/data-backup.js');
beforeEach(() => blobs.reset());

test('backup restores structured data, exact file bytes and metadata into an isolated store', async () => {
  const source = blobs.getStore('source');
  const bytes = Buffer.from('%PDF-1.7\nfixture\n%%EOF');
  const metadata = { contentType: 'application/pdf', originalName: 'fixture.pdf' };
  await source.setJSON('paid:fixture', { reference: 'fixture', supportFiles: [{ blobKey: 'supports/fixture/file.pdf' }] });
  await source.set('supports/fixture/file.pdf', bytes, { metadata });
  const result = await createStructuredDataBackup({ getStoreImpl: blobs.getStore, sourceStores: ['source'] });
  const backup = await blobs.getStore(BACKUP_STORE_NAME).get(result.backupKey, { type: 'json' });
  assert.equal(verifyBackupPayload(backup), true);
  const restored = blobs.getStore('isolated-restore');
  for (const [key, record] of Object.entries(backup.stores.source)) await restored.setJSON(key, record.data, { metadata: record.metadata });
  for (const file of backup.fileInventories.source) {
    const data = await blobs.getStore(BACKUP_STORE_NAME).get(file.backupKey, { type: 'arrayBuffer' });
    assert.equal(crypto.createHash('sha256').update(Buffer.from(data)).digest('hex'), file.sha256);
    await restored.set(file.key, data, { metadata: file.metadata });
  }
  assert.deepEqual(await restored.get('paid:fixture', { type: 'json' }), await source.get('paid:fixture', { type: 'json' }));
  assert.deepEqual(Buffer.from(await restored.get('supports/fixture/file.pdf', { type: 'arrayBuffer' })), bytes);
  assert.deepEqual((await restored.getMetadata('supports/fixture/file.pdf')).metadata, metadata);
  assert.equal(blobs.calls.filter(x => x.op === 'list' && x.name === 'source').length, 1);
  assert.equal((await getLatestBackupManifest({ getStoreImpl: blobs.getStore })).integrityVerified, true);
});

test('unchanged file copies are reused across daily snapshots and are never pruned', async () => {
  await blobs.getStore('source').set('supports/file.pdf', Buffer.from('%PDF-test'));
  for (const date of ['2026-10-17', '2026-10-18']) {
    await createStructuredDataBackup({ date: new Date(date), sourceStores: ['source'], getStoreImpl: blobs.getStore, retentionDays: 1 });
  }
  assert.equal(blobs.calls.filter(x => x.op === 'set' && x.name === BACKUP_STORE_NAME && x.key.startsWith('files/')).length, 1);
  assert.equal(blobs.calls.some(x => x.op === 'delete' && x.key.startsWith('files/')), false);
});

test('failed source reads preserve last successful backup and do not prune anything', async () => {
  const source = blobs.getStore('source');
  await source.setJSON('record', { original: true });
  await createStructuredDataBackup({ sourceStores: ['source'], getStoreImpl: blobs.getStore });
  const manifest = await blobs.getStore(BACKUP_STORE_NAME).get(BACKUP_MANIFEST_KEY, { type: 'json' });
  const failing = name => {
    const store = blobs.getStore(name);
    if (name === 'source') store.getWithMetadata = async () => { throw new Error('read failed'); };
    return store;
  };
  await assert.rejects(createStructuredDataBackup({ sourceStores: ['source'], getStoreImpl: failing }), /Incomplete backup/);
  assert.deepEqual(await blobs.getStore(BACKUP_STORE_NAME).get(BACKUP_MANIFEST_KEY, { type: 'json' }), manifest);
  assert.equal(blobs.calls.some(x => x.op === 'delete'), false);
});

test('health detects corrupted JSON instead of trusting the stored checksum', async () => {
  await blobs.getStore('source').setJSON('record', { amount: 123 });
  const result = await createStructuredDataBackup({ sourceStores: ['source'], getStoreImpl: blobs.getStore });
  const store = blobs.getStore(BACKUP_STORE_NAME);
  const data = await store.get(result.backupKey, { type: 'json' });
  data.stores.source.record.data.amount = 999;
  await store.setJSON(result.backupKey, data);
  assert.equal((await getLatestBackupManifest({ getStoreImpl: blobs.getStore })).integrityVerified, false);
});

test('a failed read-back on a same-day retry preserves the previous snapshot and manifest', async () => {
  await blobs.getStore('source').setJSON('record', { value: 'original' });
  const first = await createStructuredDataBackup({ sourceStores: ['source'], getStoreImpl: blobs.getStore });
  const failing = name => {
    const store = blobs.getStore(name);
    const get = store.get;
    if (name === BACKUP_STORE_NAME) store.get = async (key, options) => key.startsWith('daily/') && key !== first.backupKey ? null : get(key, options);
    return store;
  };
  await blobs.getStore('source').setJSON('record', { value: 'new' });
  await assert.rejects(createStructuredDataBackup({ sourceStores: ['source'], getStoreImpl: failing }), /read-back integrity/);
  const backupStore = blobs.getStore(BACKUP_STORE_NAME);
  assert.equal((await backupStore.get(first.backupKey, { type: 'json' })).stores.source.record.data.value, 'original');
  assert.equal((await backupStore.get(BACKUP_MANIFEST_KEY, { type: 'json' })).backupKey, first.backupKey);
});
