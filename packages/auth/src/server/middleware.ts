import { getAuthConfig } from '../config';
import { readSessionTokenFromCookies, resolveSessionUserId } from './sessions';

export type AuthMiddlewareOptions = {
  /** Path prefixes that skip auth even when AUTH_REQUIRED=true. */
  publicPathPrefixes: readonly string[];
  /** When any prefix matches, auth is enforced (if required). Empty = all non-public routes. */
  protectedPathPrefixes: readonly string[];
  loginPath?: string;
};

function isPublicPath(pathname: string, prefixes: readonly string[]): boolean {
  if (pathname.startsWith('/_next/') || pathname === '/favicon.ico') return true;
  return prefixes.some((prefix) => pathname.startsWith(prefix));
}

function isProtectedPath(pathname: string, prefixes: readonly string[]): boolean {
  if (prefixes.length === 0) return true;
  return prefixes.some((prefix) => pathname.startsWith(prefix));
}

export type AuthMiddlewareRequest = {
  nextUrl: { pathname: string; clone(): { pathname: string; searchParams: URLSearchParams } };
  cookies: { get(name: string): { value: string } | undefined };
};

export type AuthMiddlewareResult =
  | { action: 'next' }
  | { action: 'redirect'; location: string }
  | { action: 'unauthorized' };

export async function evaluateAuthMiddleware(
  request: AuthMiddlewareRequest,
  options: AuthMiddlewareOptions,
): Promise<AuthMiddlewareResult> {
  const config = getAuthConfig();
  const { pathname } = request.nextUrl;
  const loginPath = options.loginPath ?? '/auth/login';

  if (!config.required || isPublicPath(pathname, options.publicPathPrefixes)) {
    return { action: 'next' };
  }

  if (!isProtectedPath(pathname, options.protectedPathPrefixes)) {
    return { action: 'next' };
  }

  const token = readSessionTokenFromCookies(request.cookies, config);
  const userId = await resolveSessionUserId(token);

  if (userId) {
    return { action: 'next' };
  }

  if (pathname.startsWith('/api/')) {
    return { action: 'unauthorized' };
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = loginPath;
  loginUrl.searchParams.set('next', pathname);
  return { action: 'redirect', location: `${loginUrl.pathname}?${loginUrl.searchParams.toString()}` };
}
