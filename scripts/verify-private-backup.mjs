import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { buildStorageInventory } from '../netlify/functions/utils/storage-inventory.js';

const [directory, restoreDirectory] = process.argv.slice(2);
if (!directory) throw new Error('Usage: node scripts/verify-private-backup.mjs BACKUP_DIRECTORY [NEW_LOCAL_RESTORE_DIRECTORY]');
const root = path.resolve(directory);
const manifest = JSON.parse(await fs.readFile(path.join(root, 'manifest.json'), 'utf8'));
if (!manifest.verified || !Array.isArray(manifest.files)) throw new Error('Incomplete backup manifest');
const recordsByStore = new Map();
let totalBytes = 0;
for (const entry of manifest.files) {
  if (!/^[a-f0-9]{64}\.blob$/.test(entry.file)) throw new Error('Invalid local backup filename');
  const bytes = await fs.readFile(path.join(root, entry.file));
  if (bytes.length !== entry.bytes || crypto.createHash('sha256').update(bytes).digest('hex') !== entry.sha256) throw new Error('Backup checksum mismatch');
  totalBytes += bytes.length;
  if (!entry.key.includes('/')) {
    const records = recordsByStore.get(entry.store) || [];
    records.push(JSON.parse(bytes.toString('utf8')));
    recordsByStore.set(entry.store, records);
  }
}
// Restore only to a new local folder. This command never connects to production.
if (restoreDirectory) {
  const destination = path.resolve(restoreDirectory);
  await fs.mkdir(destination, { mode: 0o700 });
  for (const entry of manifest.files) {
    await fs.copyFile(path.join(root, entry.file), path.join(destination, entry.file), fs.constants.COPYFILE_EXCL);
    await fs.chmod(path.join(destination, entry.file), 0o600);
    const restored = await fs.readFile(path.join(destination, entry.file));
    if (crypto.createHash('sha256').update(restored).digest('hex') !== entry.sha256) throw new Error('Restore checksum mismatch');
  }
  await fs.writeFile(path.join(destination, 'manifest.json'), JSON.stringify(manifest, null, 2), { flag: 'wx', mode: 0o600 });
}
const inventory = {};
for (const [store, records] of recordsByStore) {
  if (store === 'contarae-backups') continue;
  const files = manifest.files.filter(entry => entry.store === store && entry.key.includes('/'));
  inventory[store] = buildStorageInventory(records, files).reduce((counts, file) => ({ ...counts, [file.status]: (counts[file.status] || 0) + 1 }), {});
}
console.log(JSON.stringify({ verified: true, objects: manifest.files.length, totalBytes, restoredLocally: Boolean(restoreDirectory), inventory, deleted: 0 }, null, 2));
