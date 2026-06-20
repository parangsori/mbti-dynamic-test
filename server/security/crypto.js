import { createCipheriv, createDecipheriv, createHash, randomBytes, timingSafeEqual } from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_BYTES = 12;
const TAG_BYTES = 16;

const normalizeSecret = (secret) => {
  if (!secret || typeof secret !== 'string') {
    throw new Error('missing_secret');
  }
  return createHash('sha256').update(secret).digest();
};

export const sealJson = (payload, secret, { aad = '' } = {}) => {
  const key = normalizeSecret(secret);
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: TAG_BYTES });
  if (aad) cipher.setAAD(Buffer.from(aad, 'utf8'));

  const plaintext = Buffer.from(JSON.stringify(payload), 'utf8');
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();

  return [
    'v1',
    iv.toString('base64url'),
    tag.toString('base64url'),
    encrypted.toString('base64url')
  ].join('.');
};

export const openJson = (sealed, secret, { aad = '' } = {}) => {
  if (!sealed || typeof sealed !== 'string') throw new Error('invalid_token');
  const [version, ivRaw, tagRaw, encryptedRaw] = sealed.split('.');
  if (version !== 'v1' || !ivRaw || !tagRaw || !encryptedRaw) throw new Error('invalid_token');

  const key = normalizeSecret(secret);
  const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(ivRaw, 'base64url'), {
    authTagLength: TAG_BYTES
  });
  if (aad) decipher.setAAD(Buffer.from(aad, 'utf8'));
  decipher.setAuthTag(Buffer.from(tagRaw, 'base64url'));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedRaw, 'base64url')),
    decipher.final()
  ]);

  return JSON.parse(decrypted.toString('utf8'));
};

export const safeEqualText = (a = '', b = '') => {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
};
