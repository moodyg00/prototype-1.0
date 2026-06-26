import {
  generateSessionToken,
  getAuthConfig,
  getSessionClearCookieOptions,
  getSessionCookieOptions,
  hashSessionToken,
  type AuthConfig,
} from '../index';
import { getAuthPrisma } from './db';

export type SessionRequestMeta = {
  ipAddress?: string | null;
  userAgent?: string | null;
};

export type CookieReader = {
  get(name: string): { value: string } | undefined;
};

export function readSessionTokenFromCookies(
  cookies: CookieReader,
  config: AuthConfig = getAuthConfig(),
): string | null {
  const value = cookies.get(config.cookieName)?.value;
  return value && value.trim().length > 0 ? value : null;
}

export async function resolveSessionUserId(
  token: string | null | undefined,
): Promise<string | null> {
  if (!token) return null;

  const prisma = getAuthPrisma();
  const tokenHash = hashSessionToken(token);
  const row = await prisma.userSession.findFirst({
    where: {
      tokenHash,
      expiresAt: { gt: new Date() },
      user: { isActive: true },
    },
    select: { id: true, userId: true },
  });

  if (!row) return null;

  await prisma.userSession
    .update({
      where: { id: row.id },
      data: { lastSeenAt: new Date() },
    })
    .catch(() => undefined);

  return row.userId;
}

export async function createUserSession(
  userId: string,
  meta?: SessionRequestMeta,
): Promise<{ token: string; cookieOptions: ReturnType<typeof getSessionCookieOptions> }> {
  const config = getAuthConfig();
  const prisma = getAuthPrisma();
  const token = generateSessionToken();
  const tokenHash = hashSessionToken(token);
  const expiresAt = new Date(Date.now() + config.sessionTtlDays * 24 * 60 * 60 * 1000);

  await prisma.userSession.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
      ipAddress: meta?.ipAddress?.slice(0, 45) ?? null,
      userAgent: meta?.userAgent?.slice(0, 512) ?? null,
    },
  });

  await prisma.user
    .update({
      where: { id: userId },
      data: { lastLoginAt: new Date() },
    })
    .catch(() => undefined);

  return {
    token,
    cookieOptions: getSessionCookieOptions(config),
  };
}

export async function revokeSessionToken(token: string | null | undefined): Promise<void> {
  if (!token) return;
  const prisma = getAuthPrisma();
  const tokenHash = hashSessionToken(token);
  await prisma.userSession.deleteMany({ where: { tokenHash } });
}

export function getClearSessionCookieOptions(config: AuthConfig = getAuthConfig()) {
  return getSessionClearCookieOptions(config);
}

export function getRequestSessionMeta(request: Request): SessionRequestMeta {
  const forwarded = request.headers.get('x-forwarded-for');
  const ipAddress = forwarded?.split(',')[0]?.trim() ?? null;
  const userAgent = request.headers.get('user-agent');
  return { ipAddress, userAgent };
}
