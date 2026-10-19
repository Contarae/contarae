import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';
import { installBlobMock } from './helpers/blob-store.mjs';
const blobs = installBlobMock();
const { upsertPortalEntity, loadCompanyData, loadCompanyDataRaw, saveCompanyDataRaw, loadCompactCompanyData } = await import('../netlify/functions/utils/client-portal-data.js');
const { default: saveEndpoint } = await import('../netlify/functions/client-portal-save.js');
const { default: dataEndpoint } = await import('../netlify/functions/client-portal-data.js');
const { createClientPortalSession } = await import('../netlify/functions/utils/client-portal-auth.js');
beforeEach(() => { blobs.reset(); process.env.CLIENT_PORTAL_SECRET = 'portal-test-secret'; });

test('client creation and invoicing preserve full data and compact dashboard totals', async () => {
  await upsertPortalEntity('company-a', 'customer', { name: 'Cliente Prueba', documentNumber: '1234567' });
  const customer = (await loadCompanyData('company-a')).customers[0];
  await upsertPortalEntity('company-a', 'invoice', { customerId: customer.id, total: 180000, paymentCondition: 'credito', date: '2026-10-19', dueDate: '2026-11-01' });
  const full = await loadCompanyData('company-a');
  const compact = await loadCompactCompanyData('company-a');
  assert.equal(full.customers.length, 1);
  assert.equal(full.invoices.length, 1);
  assert.equal(full.invoices[0].total, 180000);
  for (const key of ['customersCount', 'invoicesCount', 'totalBilled', 'totalPaid', 'pending', 'unappliedCredit']) {
    assert.equal(compact.dashboard[key], full.dashboard[key], key);
  }
  assert.equal(full.dashboard.pending, 180000);
  assert.equal(compact.isCompact, true);
});

test('stale concurrent writes cannot overwrite another client change', async () => {
  const original = await loadCompanyDataRaw('company-a');
  const concurrent = await loadCompanyDataRaw('company-a');
  original.company.name = 'Primer cambio';
  await saveCompanyDataRaw('company-a', original);
  concurrent.company.name = 'Cambio atrasado';
  await assert.rejects(saveCompanyDataRaw('company-a', concurrent), error => error.code === 'storage_conflict');
  assert.equal((await loadCompanyData('company-a')).company.name, 'Primer cambio');
});

test('portal endpoints use company from signed session and reject anonymous writes', async () => {
  const token = createClientPortalSession({ username: 'cliente-a', companyId: 'company-a', companyName: 'Empresa A' }, process.env.CLIENT_PORTAL_SECRET);
  const req = new Request('https://example.test/api/client-portal-save', { method: 'POST', headers: { cookie: `contarae_client_portal_session=${token}` }, body: JSON.stringify({ companyId: 'company-b', type: 'customer', payload: { name: 'Cliente autorizado' } }) });
  assert.equal((await saveEndpoint(req)).status, 200);
  assert.equal((await loadCompanyData('company-a')).customers.length, 1);
  assert.equal((await loadCompanyData('company-b')).customers.length, 0);
  const response = await dataEndpoint(new Request('https://example.test/api/client-portal-data?companyId=company-b', { headers: { cookie: `contarae_client_portal_session=${token}` } }));
  assert.equal((await response.json()).data.companyId, 'company-a');
  assert.equal((await saveEndpoint(new Request('https://example.test', { method: 'POST', body: '{}' }))).status, 401);
});
