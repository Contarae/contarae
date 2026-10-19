import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';
import { installBlobMock } from './helpers/blob-store.mjs';
const blobs = installBlobMock();
const { createBackupJobToken, verifyBackupJobToken } = await import('../netlify/functions/utils/backup-job-auth.js');
const { default: dispatch } = await import('../netlify/functions/automatic-data-backup.js');
const { default: background } = await import('../netlify/functions/automatic-data-backup-background.js');
beforeEach(() => { blobs.reset(); process.env.ADMIN_PANEL_SECRET = 'test-only-secret'; process.env.URL = 'https://example.test'; });

test('background backup rejects missing, tampered and expired tokens before accessing storage', async () => {
  const now = Date.now();
  assert.equal(verifyBackupJobToken(createBackupJobToken(now), now), true);
  for (const token of ['', 'Bearer bad', createBackupJobToken(now - 600000), `${createBackupJobToken(now)}0`]) {
    assert.equal(verifyBackupJobToken(token, now), false);
    assert.equal((await background(new Request('https://example.test', { method: 'POST', headers: { authorization: token } }))).status, 401);
  }
  assert.equal(blobs.calls.length, 0);
});

test('schedule queues an authenticated background job and never reports completion prematurely', async () => {
  globalThis.fetch = async (url, options) => {
    assert.equal(String(url), 'https://example.test/.netlify/functions/automatic-data-backup-background');
    assert.equal(verifyBackupJobToken(options.headers.Authorization), true);
    assert.equal(options.redirect, 'error');
    return new Response('', { status: 202 });
  };
  const result = await dispatch(new Request('https://example.test'));
  assert.equal(result.status, 202);
  assert.deepEqual(await result.json(), { queued: true });
  assert.equal(blobs.calls.some(x => x.name === 'contarae-backups'), false);
});

test('failed dispatch is reported as a failure', async () => {
  globalThis.fetch = async () => new Response('', { status: 503 });
  assert.equal((await dispatch(new Request('https://example.test'))).status, 500);
});

test('background storage failures reject the job rather than returning a discarded HTTP error', async () => {
  const original = globalThis.__contaraeTestGetStore;
  globalThis.__contaraeTestGetStore = (...args) => {
    const store = original(...args);
    if (args[0] === 'certification-requests') store.list = async () => { throw new Error('Storage unavailable'); };
    return store;
  };
  try {
    await assert.rejects(background(new Request('https://example.test', {
      method: 'POST', headers: { authorization: createBackupJobToken() }
    })), /Storage unavailable/);
    assert.equal(blobs.calls.some(call => call.op === 'delete'), false);
  } finally {
    globalThis.__contaraeTestGetStore = original;
  }
});
