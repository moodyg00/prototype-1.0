import { cookies } from 'next/headers';

import { getAuthConfig } from '@prototype/auth';

import { resolveSessionUserId } from '@/src/lib/auth/sessions';

/** Load the authenticated user id from the session cookie, if any. */
export async function getSessionUserIdFromCookies(): Promise<string | null> {
  const config = getAuthConfig();
  const cookieStore = await cookies();
  const token = cookieStore.get(config.cookieName)?.value ?? null;
  return resolveSessionUserId(token);
}
