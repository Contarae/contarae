import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';
import { installBlobMock } from './helpers/blob-store.mjs';

const blobs = installBlobMock();
const users = await import('../netlify/functions/utils/client-portal-users.js');
const { authenticateClientPortalCredentials } = await import('../netlify/functions/utils/client-portal-auth.js');
const input = { username: 'cliente', companyId: 'empresa-prueba', companyName: 'Empresa Prueba', email: 'test@example.test', temporaryPassword: 'Temporal-123' };
const stored = () => blobs.getStore('client-portal').get('portal-users:v1', { type: 'json' });
beforeEach(() => {
  blobs.reset();
  process.env.CLIENT_PORTAL_SECRET = 'test-secret';
  delete process.env.CLIENT_PORTAL_USERS_JSON;
});

test('create, authenticate, change and reset password retain the client company', async () => {
  const user = await users.upsertClientPortalUser(input);
  assert.equal(user.temporaryPasswordPreview, undefined);
  let data = await stored();
  assert.match(data.users[0].passwordHash, /^scrypt:/);
  assert.equal(data.users[0].passwordCipher, undefined);
  assert.equal(data.users[0].temporaryPasswordPreview, undefined);
  assert.equal((await users.authenticateStoredClientPortalUser('CLIENTE', input.temporaryPassword)).ok, true);
  assert.equal((await users.authenticateStoredClientPortalUser('cliente', 'wrong')).ok, false);
  await users.changeClientPortalPassword('cliente', input.temporaryPassword, 'Nueva-clave-456');
  assert.equal((await users.authenticateStoredClientPortalUser('cliente', input.temporaryPassword)).ok, false);
  const auth = await users.authenticateStoredClientPortalUser('cliente', 'Nueva-clave-456');
  assert.equal(auth.user.companyId, input.companyId); assert.equal(auth.user.mustChangePassword, false);
  await users.resetClientPortalPassword(user.id, 'Restablecida-789');
  assert.equal((await users.authenticateStoredClientPortalUser('cliente', 'Nueva-clave-456')).ok, false);
  assert.equal((await users.authenticateStoredClientPortalUser('cliente', 'Restablecida-789')).user.mustChangePassword, true);
  data = await stored();
  assert.equal(JSON.stringify(data).includes('Restablecida-789'), false);
});

test('legacy users keep the same password hash while reversible copies are retired', async () => {
  await users.upsertClientPortalUser(input);
  const data = await stored();
  const hash = data.users[0].passwordHash;
  data.users[0].passwordCipher = 'legacy-cipher';
  data.users[0].temporaryPasswordPreview = input.temporaryPassword;
  await blobs.getStore('client-portal').setJSON('portal-users:v1', data);
  assert.equal((await users.listClientPortalUsers())[0].temporaryPasswordPreview, undefined);
  assert.equal((await users.authenticateStoredClientPortalUser('cliente', input.temporaryPassword)).ok, true);
  const after = await stored();
  assert.equal(after.users[0].passwordHash, hash);
  assert.equal(after.users[0].passwordCipher, undefined);
  assert.equal(after.users[0].temporaryPasswordPreview, undefined);
});

test('suspended users cannot sign in and company data is never rewritten', async () => {
  const store = blobs.getStore('client-portal');
  await store.setJSON('company:empresa-prueba', { invoices: [{ id: 'historical', amount: 180000 }] });
  const user = await users.upsertClientPortalUser({ ...input, status: 'suspended' });
  assert.equal((await users.authenticateStoredClientPortalUser('cliente', input.temporaryPassword)).reason, 'suspended');
  await users.resetClientPortalPassword(user.id, 'Otra-clave-123');
  assert.deepEqual(await store.get('company:empresa-prueba', { type: 'json' }), { invoices: [{ id: 'historical', amount: 180000 }] });
});

test('legacy environment-only access works, but cannot bypass a stored password reset', async () => {
  process.env.CLIENT_PORTAL_USERS_JSON = JSON.stringify([{ ...input, password: 'Old-environment-password' }]);
  assert.equal((await authenticateClientPortalCredentials(input.username, 'Old-environment-password')).ok, true);
  await users.upsertClientPortalUser(input);
  assert.equal((await authenticateClientPortalCredentials(input.username, 'Old-environment-password')).ok, false);
  assert.equal((await authenticateClientPortalCredentials(input.username, input.temporaryPassword)).ok, true);
});
