import { NextResponse } from 'next/server';

function allowedOrigins(): string[] {
  const fromEnv = process.env.PUBLIC_SITE_ORIGINS?.split(',').map((value) => value.trim()).filter(Boolean) ?? [];
  const defaults = [
    'http://localhost:8080',
    'http://localhost:8081',
    'http://127.0.0.1:8080',
    'http://127.0.0.1:8081',
  ];
  return [...new Set([...defaults, ...fromEnv])];
}

function isDevLocalOrigin(origin: string): boolean {
  try {
    const { hostname, protocol } = new URL(origin);
    if (protocol !== 'http:' && protocol !== 'https:') return false;
    return (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      /^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
      /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
      hostname.endsWith('.local')
    );
  } catch {
    return false;
  }
}

function isOriginAllowed(origin: string): boolean {
  if (allowedOrigins().includes(origin)) return true;
  return process.env.NODE_ENV === 'development' && isDevLocalOrigin(origin);
}

export function applyPublicSiteCors(request: Request, response: NextResponse): NextResponse {
  const origin = request.headers.get('origin');
  if (origin && isOriginAllowed(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Vary', 'Origin');
    response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  }
  return response;
}

export function publicSitePreflightResponse(request: Request): NextResponse {
  const response = new NextResponse(null, { status: 204 });
  return applyPublicSiteCors(request, response);
}