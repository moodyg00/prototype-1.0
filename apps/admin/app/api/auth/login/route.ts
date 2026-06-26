import { NextResponse } from 'next/server';
import { z } from 'zod';

import { handleRouteError } from '@/src/lib/accounting/api-helpers';
import { verifyPassword } from '@/src/lib/auth/password';
import { createUserSession, getAuthSettings, getRequestSessionMeta } from '@/src/lib/auth/sessions';
import { prisma } from '@/src/lib/prisma';

export const dynamic = 'force-dynamic';

const loginSchema = z.object({
  login: z.string().trim().min(1, 'Email or username is required.'),
  password: z.string().min(1, 'Password is required.'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.parse(body);
    const login = parsed.login.toLowerCase();

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
    const config = getAuthSettings();
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
    return handleRouteError(error);
  }
}
