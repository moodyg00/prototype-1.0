import { evaluateAuthMiddleware } from '@prototype/auth/server';
import { NextResponse, type NextRequest } from 'next/server';

/** Session validation uses Prisma + node:crypto; Node runtime required (not Edge). */
export const runtime = 'nodejs';

const PUBLIC_PATH_PREFIXES = [
  '/auth/login',
  '/api/auth/',
  '/api/health/',
  // Static previews are intentionally readable without a session so they can be
  // opened in an iframe / new tab during editing.
  '/preview/',
] as const;

// Everything else (the IDE + its file/deploy APIs) is protected.
const PROTECTED_PATH_PREFIXES: readonly string[] = [];

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const result = await evaluateAuthMiddleware(request, {
    publicPathPrefixes: PUBLIC_PATH_PREFIXES,
    protectedPathPrefixes: PROTECTED_PATH_PREFIXES,
  });

  if (result.action === 'next') return NextResponse.next();
  if (result.action === 'unauthorized') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return NextResponse.redirect(new URL(result.location, request.url));
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
