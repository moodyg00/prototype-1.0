import { handleAuthMiddleware } from '@/lib/auth/middleware';

export async function middleware(request: import('next/server').NextRequest) {
  return handleAuthMiddleware(request);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
