import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

type AdminUserRow = {
  id: string;
  fullName: string;
  email: string | null;
  roleId: string | null;
  role: string;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string | null;
};

export async function GET() {
  try {
    const { prisma } = await import('@/src/lib/prisma');

    const users = await prisma.user.findMany({
      orderBy: [{ createdAt: 'asc' }, { email: 'asc' }],
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

    const records: AdminUserRow[] = users.map((user) => ({
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      roleId: user.roleId,
      role: user.roleRef?.name ?? 'Unassigned',
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
      createdAt: user.createdAt ? user.createdAt.toISOString() : null,
    }));

    return NextResponse.json({ users: records }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to load users.' },
      { status: 500 },
    );
  }
}
