import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createContentSnapshot, getContentSnapshotStats } from '../server/content-vault/snapshot.js';
import { sealJson } from '../server/security/crypto.js';

const key = process.env.CONTENT_VAULT_KEY;
if (!key) {
  console.error('CONTENT_VAULT_KEY is required to build the encrypted content vault.');
  process.exit(1);
}

const outputPath = process.argv[2] || 'server/content-vault/content.enc.json';
const snapshot = createContentSnapshot();
const sealed = sealJson(snapshot, key, { aad: 'today-mbti-content-vault-v1' });
const payload = {
  schemaVersion: 1,
  encryptedAt: new Date().toISOString(),
  stats: getContentSnapshotStats(snapshot),
  payload: sealed
};

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`);

console.log(`Wrote encrypted content vault: ${outputPath}`);
console.log(JSON.stringify(payload.stats, null, 2));
