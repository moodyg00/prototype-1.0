import { cookies } from 'next/headers';

import { getAuthConfig } from '@prototype/auth';
import { readSessionTokenFromCookies, resolveSessionUserId } from '@prototype/auth/server';

export async function getSessionUserIdFromCookies(): Promise<string | null> {
  const config = getAuthConfig();
  const cookieStore = await cookies();
  return resolveSessionUserId(readSessionTokenFromCookies(cookieStore, config));
}

export async function getSessionUser() {
  const userId = await getSessionUserIdFromCookies();
  if (!userId) return null;

  const { getAuthPrisma } = await import('@prototype/auth/server');
  return getAuthPrisma().user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      username: true,
      fullName: true,
      roleRef: { select: { name: true } },
    },
  });
}
