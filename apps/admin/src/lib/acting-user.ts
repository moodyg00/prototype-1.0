import { prisma } from '@/src/lib/prisma';
import { parseRolePermissions, type ActingUser } from '@/src/lib/user-roles/permissions';
import { DEFAULT_ROLE_PERMISSIONS } from '@/src/lib/validation/user-roles';

let cachedActingUser: { user: ActingUser | null; at: number } | null = null;
const CACHE_MS = 30_000;

export async function resolveActingUser(): Promise<ActingUser | null> {
  if (cachedActingUser && Date.now() - cachedActingUser.at < CACHE_MS) {
    return cachedActingUser.user;
  }

  let userId: string | null = null;

  try {
    const { createClient } = await import('@/src/lib/supabase/server');
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    const email = data.user?.email;
    if (email) {
      const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true },
      });
      userId = user?.id ?? null;
    }
  } catch {
    // Supabase optional in dev.
  }

  if (!userId) {
    const fallback = await prisma.user.findFirst({
      where: { isActive: true, roleRef: { name: 'Admin' } },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });
    userId = fallback?.id ?? null;
  }

  if (!userId) {
    cachedActingUser = { user: null, at: Date.now() };
    return null;
  }

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

  if (!row) {
    cachedActingUser = { user: null, at: Date.now() };
    return null;
  }

  const permissions = row.roleRef
    ? parseRolePermissions(row.roleRef.permissions, row.roleRef.name)
    : DEFAULT_ROLE_PERMISSIONS.Contractor;

  const actingUser: ActingUser = {
    id: row.id,
    fullName: row.fullName,
    email: row.email,
    roleId: row.roleId,
    roleName: row.roleRef?.name ?? null,
    permissions,
  };

  cachedActingUser = { user: actingUser, at: Date.now() };
  return actingUser;
}
