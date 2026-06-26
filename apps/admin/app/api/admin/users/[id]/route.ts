import { NextResponse } from 'next/server';

import { handleRouteError, readJsonBody } from '@/src/lib/accounting/api-helpers';
import { prisma } from '@/src/lib/prisma';
import { userRoleAssignSchema } from '@/src/lib/validation/user-roles';

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const body = await readJsonBody(request);
    const parsed = userRoleAssignSchema.parse(body);

    const [user, role] = await Promise.all([
      prisma.user.findUnique({ where: { id }, select: { id: true } }),
      prisma.userRole.findUnique({ where: { id: parsed.roleId }, select: { id: true, name: true } }),
    ]);

    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }
    if (!role) {
      return NextResponse.json({ error: 'Role not found.' }, { status: 404 });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { roleId: parsed.roleId },
      select: {
        id: true,
        fullName: true,
        email: true,
        roleId: true,
        roleRef: { select: { name: true } },
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      user: {
        id: updated.id,
        fullName: updated.fullName,
        email: updated.email,
        roleId: updated.roleId,
        role: updated.roleRef?.name ?? 'Unassigned',
        isActive: updated.isActive,
        lastLoginAt: updated.lastLoginAt ? updated.lastLoginAt.toISOString() : null,
        createdAt: updated.createdAt ? updated.createdAt.toISOString() : null,
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
