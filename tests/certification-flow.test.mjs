import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';
import crypto from 'node:crypto';
import { installBlobMock } from './helpers/blob-store.mjs';

const blobs = installBlobMock();
const { default: savePending } = await import('../netlify/functions/save-pending-form.js');
const { default: webhook } = await import('../netlify/functions/wompi-webhook.js');
const { default: verify } = await import('../netlify/functions/public-verify-certification.js');
const { default: sendCertificate } = await import('../netlify/functions/admin-send-certification.js');
const { createAdminSession } = await import('../netlify/functions/utils/admin-auth.js');
const { eventHandler: sign, default: signRequest } = await import('../netlify/functions/wompi-signature.js');
const { eventHandler: validatePromo, default: promoRequest } = await import('../netlify/functions/validate-promo-code.js');
const reference = 'CONTARAE-1792368000000-TESTA';
let emails;
const post = (route, body, admin = false) => new Request(`https://example.test/api/${route}`, {
  method: 'POST', headers: { 'Content-Type': 'application/json', ...(admin ? { cookie: `contarae_admin_session=${createAdminSession('test-admin','test-secret')}` } : {}) }, body: JSON.stringify(body)
});
const form = () => ({ reference, nombre: 'Cliente De Prueba', tipo_documento: 'CC', numero_documento: '123456789', telefono: '3001234567', correo: 'test@example.test', destino: 'Banco', periodo: '3 meses', periodo_meses: '3', total_ingresos_num: '2000000', total_ingresos: '$ 2.000.000', supportFiles: [{ blobKey: `supports/${reference}/prueba.pdf`, originalName: 'prueba.pdf' }] });
function event(status = 'APPROVED', amount = 8000000) {
  const body = { event: 'transaction.updated', timestamp: 1792368000, data: { transaction: { id: 'tx-test', reference, status, amount_in_cents: amount, currency: 'COP', customer_email: 'test@example.test', payment_method_type: 'CARD' } } };
  const properties = ['transaction.id', 'transaction.status', 'transaction.amount_in_cents'];
  const values = properties.map(p => p.split('.').reduce((v,k) => v[k], body.data)).join('');
  body.signature = { properties, checksum: crypto.createHash('sha256').update(`${values}${body.timestamp}events-test`).digest('hex') };
  return body;
}
beforeEach(() => {
  blobs.reset(); emails = [];
  Object.assign(process.env, { WOMPI_EVENTS_SECRET: 'events-test', WOMPI_INTEGRITY_KEY: 'integrity-test', RESEND_API_KEY: 'resend-test', ADMIN_PANEL_USERNAME: 'test-admin', ADMIN_PANEL_PASSWORD: 'test-password', ADMIN_PANEL_SECRET: 'test-secret' });
  delete process.env.GA4_API_SECRET;
  globalThis.fetch = async (url, options) => {
    assert.equal(url, 'https://api.resend.com/emails', 'Tests must never call an external service');
    emails.push({ ...JSON.parse(options.body), idempotencyKey: options.headers['Idempotency-Key'] });
    return new Response(JSON.stringify({ id: `email-${emails.length}` }), { status: 200 });
  };
});

test('pending purchase keeps supports and server price; signature rejects changed amounts', async () => {
  assert.equal((await savePending(post('save-pending-form', form()))).status, 200);
  const record = await blobs.getStore('certification-requests').get(`pending:${reference}`, { type: 'json' });
  assert.equal(record.pricing.finalAmount, 80000);
  assert.deepEqual(record.supportFiles, form().supportFiles);
  const input = { reference, currency: 'COP', monthlyIncome: 2000000, amountInCents: 8000000 };
  const result = await sign({ httpMethod: 'POST', headers: {}, body: JSON.stringify(input) });
  assert.equal(result.statusCode, 200);
  assert.equal(JSON.parse(result.body).signature, crypto.createHash('sha256').update(`${reference}8000000COPintegrity-test`).digest('hex'));
  assert.equal((await sign({ httpMethod: 'POST', body: JSON.stringify({ ...input, amountInCents: 1 }) })).statusCode, 400);
});

test('invalid signature cannot approve a purchase or send emails', async () => {
  await savePending(post('pending', form()));
  const body = event(); body.signature.checksum = 'invalid';
  assert.equal((await webhook(post('webhook', body))).status, 401);
  assert.equal(await blobs.getStore('certification-requests').get(`paid:${reference}`), null);
  assert.equal(emails.length, 0);
});

test('v2 payment endpoints preserve event responses, preflight and bounded body errors', async () => {
  for (const [endpoint, legacy, input, limit] of [
    [signRequest, sign, { reference, currency: 'COP', monthlyIncome: 2000000, amountInCents: 8000000 }, 20 * 1024],
    [promoRequest, validatePromo, { code: 'INEXISTENTE', monthlyIncome: 2000000 }, 12 * 1024]
  ]) {
    const expected = await legacy({ httpMethod: 'POST', headers: {}, body: JSON.stringify(input) });
    const actual = await endpoint(post('endpoint', input));
    assert.equal(actual.status, expected.statusCode);
    assert.deepEqual(await actual.json(), JSON.parse(expected.body));
    assert.equal((await endpoint(new Request('https://example.test', { method: 'OPTIONS' }))).status, 200);
    assert.equal((await endpoint(new Request('https://example.test'))).status, 405);
    assert.equal((await endpoint(new Request('https://example.test', { method: 'POST', body: '{' }))).status, 400);
    assert.equal((await endpoint(post('endpoint', { text: 'x'.repeat(limit) }))).status, 413);
  }
});

test('declined and pending transactions do not create paid records', async () => {
  await savePending(post('pending', form()));
  for (const status of ['PENDING', 'DECLINED', 'ERROR', 'VOIDED']) {
    assert.equal((await webhook(post('webhook', event(status)))).status, 200);
    assert.equal(await blobs.getStore('certification-requests').get(`paid:${reference}`), null);
  }
  assert.equal(emails.length, 0);
});

test('amount mismatch leaves purchase unpaid', async () => {
  await savePending(post('pending', form()));
  assert.equal((await webhook(post('webhook', event('APPROVED', 100)))).status, 409);
  assert.equal(await blobs.getStore('certification-requests').get(`paid:${reference}`), null);
  assert.equal(emails.length, 0);
});

test('approved webhook retry preserves consecutive, supports and email idempotency', async () => {
  await savePending(post('pending', form()));
  assert.equal((await webhook(post('webhook', event()))).status, 200);
  const store = blobs.getStore('certification-requests');
  const first = await store.get(`paid:${reference}`, { type: 'json' });
  assert.equal(first.status, 'approved'); assert.equal(first.consecutive, 1000);
  assert.deepEqual(first.supportFiles, form().supportFiles);
  assert.equal(emails.length, 2);
  assert.equal((await webhook(post('webhook', event()))).status, 200);
  assert.equal(emails.length, 2);
  assert.equal((await store.get(`paid:${reference}`, { type: 'json' })).consecutive, 1000);
});

test('issue and correct actual PDF; previous version stays stored and verifies as replaced', async () => {
  await savePending(post('pending', form()));
  await webhook(post('webhook', event()));
  const store = blobs.getStore('certification-requests');
  const issue = await sendCertificate(post('send', { reference, confirmedReview: true }, true));
  assert.equal(issue.status, 200, await issue.text());
  const first = await store.get(`paid:${reference}`, { type: 'json' });
  assert.equal(first.certificateVersion, 1);
  const issued = first.issuedCertificates[0];
  const pdf = await store.get(issued.blobKey, { type: 'arrayBuffer' });
  assert.equal(Buffer.from(pdf).subarray(0, 5).toString(), '%PDF-');
  assert.equal(crypto.createHash('sha256').update(Buffer.from(pdf)).digest('hex'), issued.hash);
  const correction = await sendCertificate(post('send', { reference, confirmedReview: true, correctionReason: 'Ajuste autorizado de prueba', overridePassword: 'test-password', certificateOverrides: { destino: 'Banco de prueba' } }, true));
  assert.equal(correction.status, 200, await correction.text());
  const second = await store.get(`paid:${reference}`, { type: 'json' });
  assert.equal(second.certificateVersion, 2); assert.equal(second.issuedCertificates.length, 2);
  assert.equal(second.issuedCertificates[0].status, 'reemplazada');
  assert.ok(await store.get(issued.blobKey));
  const old = await (await verify(new Request(`https://example.test/api/verify?code=${issued.verificationCode}`))).json();
  assert.equal(old.valid, false); assert.equal(old.status.code, 'version_reemplazada');
  const latest = await (await verify(new Request(`https://example.test/api/verify?code=${second.certificateVerificationCode}`))).json();
  assert.equal(latest.valid, true); assert.equal(latest.certificate.version, 2);
});
