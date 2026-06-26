/**
 * Opaque public-token + slug helpers for booking links.
 *
 * `publicToken` is the unguessable handle used in the public URL
 * (`/book/<token>`). It must be hard to enumerate, so we use crypto-random
 * bytes (not the slug, which is human-readable and guessable).
 */
import { randomBytes } from 'node:crypto';

/** URL-safe, ~43-char random token (fits the VarChar(64) column). */
export function generatePublicToken(): string {
  return `tok_${randomBytes(24).toString('base64url')}`;
}

/** Slugify a human label into a URL-safe slug (lowercase, hyphenated). */
export function slugify(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120) || 'link';
}

/**
 * Append a short random suffix to keep a slug unique without an extra DB
 * round-trip on collision-prone names.
 */
export function uniqueSlug(input: string): string {
  const base = slugify(input);
  const suffix = randomBytes(3).toString('hex');
  return `${base}-${suffix}`.slice(0, 120);
}
