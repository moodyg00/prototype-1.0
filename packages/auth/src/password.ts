import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const SCRYPT_KEY_LENGTH = 64;
const SCRYPT_OPTIONS = { N: 16384, r: 8, p: 1 } as const;

/** Hash a plaintext password for storage in `users.password_hash`. */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const derived = scryptSync(password, salt, SCRYPT_KEY_LENGTH, SCRYPT_OPTIONS).toString('hex');
  return `scrypt$${salt}$${derived}`;
}

/** Verify a plaintext password against a stored scrypt hash. */
export function verifyPassword(password: string, storedHash: string | null | undefined): boolean {
  if (!storedHash?.startsWith('scrypt$')) return false;
  const [, salt, expectedHex] = storedHash.split('$');
  if (!salt || !expectedHex) return false;
  const derived = scryptSync(password, salt, SCRYPT_KEY_LENGTH, SCRYPT_OPTIONS);
  const expected = Buffer.from(expectedHex, 'hex');
  if (derived.length !== expected.length) return false;
  return timingSafeEqual(derived, expected);
}
