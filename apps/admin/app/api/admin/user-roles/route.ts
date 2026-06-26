import { NextResponse } from 'next/server';

import { handleRouteError, readJsonBody } from '@/src/lib/accounting/api-helpers';
import {
  createUserRole,
  deleteUserRole,
  ensureDefaultUserRoles,
  listUserRoles,
  updateUserRole,
} from '@/src/lib/user-roles/user-roles';

export async function GET() {
  try {
    await ensureDefaultUserRoles();
    const roles = await listUserRoles();
    return NextResponse.json({ roles });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await readJsonBody(request);
    const role = await createUserRole(body);
    return NextResponse.json({ role }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
