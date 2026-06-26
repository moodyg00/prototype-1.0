import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getAuthConfig, verifyPassword } from '@prototype/auth';
import {
  createUserSession,
  getClearSessionCookieOptions,
  getRequestSessionMeta,
  readSessionTokenFromCookies,
  resolveSessionUserId,
  revokeSessionToken,
  getAuthPrisma,
} from '@prototype/auth/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

const loginSchema = z.object({
  login: z.string().trim().min(1),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.parse(body);
    const login = parsed.login.toLowerCase();
    const prisma = getAuthPrisma();

    const user = await prisma.user.findFirst({
      where: {
        isActive: true,
        userType: 'human',
        OR: [{ email: login }, { username: parsed.login.trim() }],
      },
      select: {
        id: true,
        email: true,
        username: true,
        fullName: true,
        passwordHash: true,
      },
    });

    if (!user?.passwordHash || !verifyPassword(parsed.password, user.passwordHash)) {
      return NextResponse.json({ error: 'Invalid email/username or password.' }, { status: 401 });
    }

    const session = await createUserSession(user.id, getRequestSessionMeta(request));
    const config = getAuthConfig();
    const response = NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        fullName: user.fullName,
      },
    });
    response.cookies.set(config.cookieName, session.token, session.cookieOptions);
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to sign in.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE() {
  const config = getAuthConfig();
  const cookieStore = await cookies();
  const token = readSessionTokenFromCookies(cookieStore, config);
  await revokeSessionToken(token);

  const response = NextResponse.json({ ok: true });
  response.cookies.set(config.cookieName, '', getClearSessionCookieOptions(config));
  return response;
}

export async function GET() {
  const config = getAuthConfig();
  const cookieStore = await cookies();
  const userId = await resolveSessionUserId(readSessionTokenFromCookies(cookieStore, config));

  if (!userId) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const user = await getAuthPrisma().user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      username: true,
      fullName: true,
      roleRef: { select: { name: true } },
    },
  });

  if (!user) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      fullName: user.fullName,
      roleName: user.roleRef?.name ?? null,
    },
  });
}
