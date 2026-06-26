import { handleAuthMiddleware } from '@/src/lib/auth/middleware';

/** Session validation uses Prisma + node:crypto; Node runtime required (not Edge). */
export const runtime = 'nodejs';

export async function middleware(request: import('next/server').NextRequest) {
  return handleAuthMiddleware(request);
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*', '/api/tasks/:path*', '/api/agent-demo/:path*'],
};