import { handleAuthMiddleware } from '@/lib/auth/middleware';

/** Session validation uses Prisma + node:crypto; Node runtime required (not Edge). */
export const runtime = 'nodejs';

export async function middleware(request: import('next/server').NextRequest) {
  return handleAuthMiddleware(request);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
