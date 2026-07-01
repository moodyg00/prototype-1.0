import { createHash } from 'node:crypto';

/** Short SHA-256 fingerprint of file text (ZeroLang-style stale-state guard). */
export function contentFingerprint(content: string): string {
  return createHash('sha256').update(content, 'utf8').digest('hex').slice(0, 16);
}

export function formatContentHash(content: string): string {
  return `sha256:${contentFingerprint(content)}`;
}

/** Accept `sha256:abc…` or bare hex from read_file / prior patch response. */
export function normalizeContentHash(value: string): string {
  const trimmed = value.trim();
  if (trimmed.startsWith('sha256:')) return trimmed.slice(7);
  return trimmed;
}

export function contentHashMatches(content: string, expectHash: string): boolean {
  const expected = normalizeContentHash(expectHash);
  if (!expected) return false;
  return contentFingerprint(content) === expected;
}
