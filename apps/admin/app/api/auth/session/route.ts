import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { handleRouteError } from '@/src/lib/accounting/api-helpers';
import { getAuthConfig } from '@prototype/auth';
import { getSessionUserIdFromCookies } from '@/src/lib/auth/get-session';
import { getClearSessionCookieOptions, revokeSessionToken } from '@/src/lib/auth/sessions';
import { prisma } from '@/src/lib/prisma';

export const dynamic = 'force-dynamic';

export async function DELETE() {
  try {
    const config = getAuthConfig();
    const cookieStore = await cookies();
    const token = cookieStore.get(config.cookieName)?.value ?? null;
    await revokeSessionToken(token);

    const response = NextResponse.json({ ok: true });
    response.cookies.set(config.cookieName, '', getClearSessionCookieOptions(config));
    return response;
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function GET() {
  try {
    const userId = await getSessionUserIdFromCookies();

    if (!userId) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
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
  } catch (error) {
    return handleRouteError(error);
  }
}
