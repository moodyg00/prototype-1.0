import { getAuthConfig } from '@prototype/auth';

import { prisma } from '@/src/lib/prisma';
import { getSessionUserIdFromCookies } from '@/src/lib/auth/get-session';
import { parseRolePermissions, type ActingUser } from '@/src/lib/user-roles/permissions';
import { DEFAULT_ROLE_PERMISSIONS } from '@/src/lib/validation/user-roles';

let cachedActingUser: { user: ActingUser | null; at: number } | null = null;
const CACHE_MS = 30_000;

async function loadActingUserById(userId: string): Promise<ActingUser | null> {
  const row = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      fullName: true,
      email: true,
      roleId: true,
      roleRef: { select: { id: true, name: true, permissions: true } },
    },
  });

  if (!row) return null;

  const permissions = row.roleRef
    ? parseRolePermissions(row.roleRef.permissions, row.roleRef.name)
    : DEFAULT_ROLE_PERMISSIONS.Contractor;

  return {
    id: row.id,
    fullName: row.fullName,
    email: row.email,
    roleId: row.roleId,
    roleName: row.roleRef?.name ?? null,
    permissions,
  };
}

async function resolveDevFallbackUserId(): Promise<string | null> {
  const fallback = await prisma.user.findFirst({
    where: { isActive: true, roleRef: { name: 'Admin' } },
    orderBy: { createdAt: 'asc' },
    select: { id: true },
  });
  return fallback?.id ?? null;
}

export async function resolveActingUser(): Promise<ActingUser | null> {
  if (cachedActingUser && Date.now() - cachedActingUser.at < CACHE_MS) {
    return cachedActingUser.user;
  }

  let userId: string | null = null;

  try {
    userId = await getSessionUserIdFromCookies();
  } catch {
    // Cookie/session lookup is optional when auth is disabled in dev.
  }

  if (!userId && !getAuthConfig().required) {
    userId = await resolveDevFallbackUserId();
  }

  if (!userId) {
    cachedActingUser = { user: null, at: Date.now() };
    return null;
  }

  const actingUser = await loadActingUserById(userId);
  cachedActingUser = { user: actingUser, at: Date.now() };
  return actingUser;
}
