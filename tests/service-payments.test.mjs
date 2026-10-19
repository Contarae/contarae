import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';
import { installBlobMock } from './helpers/blob-store.mjs';
const blobs = installBlobMock();
const { listPublicServicePaymentsByDocument, listServicePayments, upsertServiceRequest, registerManualServicePayment } = await import('../netlify/functions/utils/service-requests.js');
beforeEach(() => blobs.reset());

test('public search preserves document normalization, type filtering and balances after updates', async () => {
  const base = { title: 'Servicio de prueba', client: { name: 'Cliente Prueba', documentNumber: '1.234.567', documentType: 'CC', email: 'test@example.test', phone: '3001234567' }, agreedPrice: '$ 180.000', amountPaid: '$ 50.000' };
  base.dueDate = '2026-12-31';
  const created = await upsertServiceRequest(base);
  const reference = created.reference || created.summary?.reference;
  assert.ok(reference);
  await registerManualServicePayment(reference, { amount: 50000 });
  const found = await listPublicServicePaymentsByDocument({ documentType: 'CC', documentNumber: '1234567' });
  assert.equal(found.requests.length, 1);
  assert.equal(found.pendingAmount, 130000);
  assert.equal((await listPublicServicePaymentsByDocument({ documentType: 'NIT', documentNumber: '1234567' })).requests.length, 0);
  await upsertServiceRequest({ ...base, reference, status: 'cancelado' });
  assert.equal((await listPublicServicePaymentsByDocument({ documentNumber: '1234567' })).requests.length, 0);
});

test('admin payment list reuses a single record pass without re-reading every detail', async () => {
  const created = await upsertServiceRequest({ title: 'Servicio', dueDate: '2026-12-31', client: { name: 'Cliente', documentType: 'CC', documentNumber: '1234567', phone: '3001234567', email: 'test@example.test' }, agreedPrice: '$ 100.000' });
  await registerManualServicePayment(created.reference, { amount: 20000 });
  blobs.calls.length = 0;
  const payments = await listServicePayments();
  assert.equal(payments.length, 1);
  assert.equal(blobs.calls.filter(x => x.op === 'get' && x.key.startsWith('request:')).length, 0);
  assert.equal(blobs.calls.filter(x => x.op === 'getWithMetadata').length, 1);
});
