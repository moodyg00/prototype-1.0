export {
  createUserSession,
  getClearSessionCookieOptions,
  getRequestSessionMeta,
  readSessionTokenFromCookies,
  resolveSessionUserId,
  revokeSessionToken,
  type CookieReader,
  type SessionRequestMeta,
} from '@prototype/auth/server';

export { getAuthConfig as getAuthSettings } from '@prototype/auth';

import type { NextRequest } from 'next/server';

import { getAuthConfig } from '@prototype/auth';
import { readSessionTokenFromCookies as readToken } from '@prototype/auth/server';

/** Read session token from a Next.js request. */
export function readSessionTokenFromRequest(
  request: Pick<NextRequest, 'cookies'>,
  config = getAuthConfig(),
): string | null {
  return readToken(request.cookies, config);
}
