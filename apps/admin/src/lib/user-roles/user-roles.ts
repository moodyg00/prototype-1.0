import { prisma } from '@/src/lib/prisma';
import { parseRolePermissions } from '@/src/lib/user-roles/permissions';
import {
  DEFAULT_ROLE_PERMISSIONS,
  userRoleCreateSchema,
  userRoleUpdateSchema,
  type RolePermissions,
} from '@/src/lib/validation/user-roles';

export class UserRoleServiceError extends Error {
  constructor(
    message: string,
    readonly status = 400,
  ) {
    super(message);
    this.name = 'UserRoleServiceError';
  }
}

export type UserRoleDto = {
  id: string;
  name: string;
  permissions: RolePermissions;
  isSystem: boolean;
  userCount: number;
  createdAt: string | null;
  updatedAt: string | null;
};

function serializeRole(row: {
  id: string;
  name: string;
  permissions: unknown;
  isSystem: boolean;
  createdAt: Date | null;
  updatedAt: Date | null;
  _count: { users: number };
}): UserRoleDto {
  return {
    id: row.id,
    name: row.name,
    permissions: parseRolePermissions(row.permissions, row.name),
    isSystem: row.isSystem,
    userCount: row._count.users,
    createdAt: row.createdAt?.toISOString() ?? null,
    updatedAt: row.updatedAt?.toISOString() ?? null,
  };
}

export async function listUserRoles(): Promise<UserRoleDto[]> {
  const rows = await prisma.userRole.findMany({
    orderBy: [{ isSystem: 'desc' }, { name: 'asc' }],
    include: { _count: { select: { users: true } } },
  });
  return rows.map(serializeRole);
}

export async function createUserRole(input: unknown): Promise<UserRoleDto> {
  const parsed = userRoleCreateSchema.parse(input);
  const existing = await prisma.userRole.findUnique({ where: { name: parsed.name } });
  if (existing) throw new UserRoleServiceError('A role with this name already exists.', 409);

  const row = await prisma.userRole.create({
    data: {
      name: parsed.name,
      permissions: parsed.permissions,
    },
    include: { _count: { select: { users: true } } },
  });
  return serializeRole(row);
}

export async function updateUserRole(id: string, input: unknown): Promise<UserRoleDto> {
  const parsed = userRoleUpdateSchema.parse(input);
  const existing = await prisma.userRole.findUnique({ where: { id } });
  if (!existing) throw new UserRoleServiceError('Role not found.', 404);

  if (parsed.name && parsed.name !== existing.name) {
    const conflict = await prisma.userRole.findUnique({ where: { name: parsed.name } });
    if (conflict) throw new UserRoleServiceError('A role with this name already exists.', 409);
  }

  const row = await prisma.userRole.update({
    where: { id },
    data: {
      name: parsed.name,
      permissions: parsed.permissions,
    },
    include: { _count: { select: { users: true } } },
  });
  return serializeRole(row);
}

export async function deleteUserRole(id: string): Promise<void> {
  const existing = await prisma.userRole.findUnique({
    where: { id },
    include: { _count: { select: { users: true } } },
  });
  if (!existing) throw new UserRoleServiceError('Role not found.', 404);
  if (existing._count.users > 0) {
    throw new UserRoleServiceError(
      `Cannot delete "${existing.name}" while ${existing._count.users} user(s) still use it. Reassign them first.`,
      409,
    );
  }
  if (existing.isSystem) {
    throw new UserRoleServiceError('System roles cannot be deleted.', 403);
  }
  await prisma.userRole.delete({ where: { id } });
}

export async function ensureDefaultUserRoles(): Promise<void> {
  for (const [name, permissions] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
    await prisma.userRole.upsert({
      where: { name },
      create: { name, permissions, isSystem: true },
      update: {},
    });
  }
}

export async function getAdminRoleId(): Promise<string | null> {
  const role = await prisma.userRole.findUnique({ where: { name: 'Admin' }, select: { id: true } });
  return role?.id ?? null;
}
