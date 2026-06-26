import { NextResponse } from 'next/server';

import { handleRouteError, readJsonBody } from '@/src/lib/accounting/api-helpers';
import { createUserSession, getAuthSettings, getRequestSessionMeta } from '@/src/lib/auth/sessions';
import { findValidInvite } from '@/src/lib/auth/invite-tokens';
import { acceptInvite } from '@/src/lib/users/users';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  context: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await context.params;
    const invite = await findValidInvite(token);
    if (!invite) {
      return NextResponse.json({ error: 'Invite link is invalid or expired.' }, { status: 404 });
    }

    return NextResponse.json({
      invite: {
        email: invite.email,
        roleName: invite.roleName,
        expiresAt: invite.expiresAt.toISOString(),
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await context.params;
    const body = await readJsonBody(request);
    const result = await acceptInvite(token, body);
    const session = await createUserSession(result.userId, getRequestSessionMeta(request));
    const config = getAuthSettings();
    const response = NextResponse.json({ ok: true, user: result }, { status: 200 });
    response.cookies.set(config.cookieName, session.token, session.cookieOptions);
    return response;
  } catch (error) {
    return handleRouteError(error);
  }
}
