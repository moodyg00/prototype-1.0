import { NextResponse } from 'next/server';

import { handleRouteError, readJsonBody } from '@/src/lib/accounting/api-helpers';
import { deleteUserRole, updateUserRole } from '@/src/lib/user-roles/user-roles';

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const body = await readJsonBody(request);
    const role = await updateUserRole(id, body);
    return NextResponse.json({ role });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    await deleteUserRole(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
