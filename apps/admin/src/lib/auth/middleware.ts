import { evaluateAuthMiddleware } from '@prototype/auth/server';
import { NextResponse, type NextRequest } from 'next/server';

const PUBLIC_PATH_PREFIXES = [
  '/auth/login',
  '/invite/',
  '/api/auth/',
  '/api/health/',
  '/api/book/',
  '/api/webhooks/',
  '/api/cron/',
] as const;

const PROTECTED_PATH_PREFIXES = ['/admin', '/api/admin', '/api/tasks', '/api/agent-demo'] as const;

export async function handleAuthMiddleware(request: NextRequest): Promise<NextResponse> {
  const result = await evaluateAuthMiddleware(request, {
    publicPathPrefixes: PUBLIC_PATH_PREFIXES,
    protectedPathPrefixes: PROTECTED_PATH_PREFIXES,
  });

  if (result.action === 'next') {
    return NextResponse.next();
  }

  if (result.action === 'unauthorized') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.redirect(new URL(result.location, request.url));
}
