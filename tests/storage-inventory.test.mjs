import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildStorageInventory } from '../netlify/functions/utils/storage-inventory.js';
test('inventory protects historical attachments, recent uploads and unknown-age files', () => {
  const records = [{ issuedCertificates: [{ blobKey: 'issued/historical.pdf' }], supportFiles: [{ blobKey: 'supports/paid.pdf' }] }];
  const file = (key, uploadedAt) => ({ key, metadata: { uploadedAt } });
  const result = buildStorageInventory(records, [file('issued/historical.pdf','2020-01-01'), file('supports/paid.pdf','2020-01-01'), file('supports/abandoned.pdf','2020-01-01'), file('supports/new.pdf','2026-10-17'), file('supports/unknown.pdf',''), file('professional/card.pdf','2020-01-01')], { date: new Date('2026-10-18') });
  assert.deepEqual(result.map(x => x.status), ['referenced','referenced','review_candidate','recent','unknown_age','protected']);
});
