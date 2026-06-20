import assert from 'node:assert/strict';
import { createContentSnapshot, getContentSnapshotStats } from '../server/content-vault/snapshot.js';
import { openJson, sealJson } from '../server/security/crypto.js';

const testKey = 'local-content-vault-test-key';
const snapshot = createContentSnapshot();
const stats = getContentSnapshotStats(snapshot);

assert.equal(stats.baseQuestionCount, 72);
assert.equal(stats.extendedQuestionCount, 248);
assert.equal(stats.resultTypeCount, 16);
assert.equal(stats.typeCharacterCount, 16);

const sealed = sealJson(snapshot, testKey, { aad: 'today-mbti-content-vault-v1' });
assert.equal(sealed.includes('친구랑 신나게'), false, 'sealed vault must not contain plaintext question copy');

const opened = openJson(sealed, testKey, { aad: 'today-mbti-content-vault-v1' });
assert.deepEqual(getContentSnapshotStats(opened), stats);

assert.throws(() => openJson(sealed, 'wrong-key', { aad: 'today-mbti-content-vault-v1' }));

console.log('Content vault checks passed.');
