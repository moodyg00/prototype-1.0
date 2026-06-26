import { NextResponse } from 'next/server';

import { handleRouteError, readJsonBody } from '@/src/lib/accounting/api-helpers';
import { resolveActingUser } from '@/src/lib/acting-user';
import {
  createAutomationUser,
  inviteHumanUser,
  listAdminUsers,
} from '@/src/lib/users/users';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const users = await listAdminUsers();
    return NextResponse.json({ users }, { status: 200 });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await readJsonBody(request);
    const actingUser = await resolveActingUser();
    const mode = typeof body === 'object' && body !== null && 'mode' in body ? body.mode : null;

    if (mode === 'invite') {
      const result = await inviteHumanUser(body, { createdBy: actingUser?.id ?? null });
      return NextResponse.json(result, { status: 201 });
    }

    const result = await createAutomationUser(body, { createdBy: actingUser?.id ?? null });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
