import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export type LogEntryUser = {
  id: string;
  fullName: string;
  email: string | null;
  avatarUrl: string | null;
  userType: string;
};

export type LogEntry = {
  id: string;
  tableName: string;
  recordId: string;
  action: string;
  createdAt: string | null;
  changes: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  user: LogEntryUser | null;
};

export async function GET() {
  try {
    const { prisma } = await import('@/src/lib/prisma');

    const records = await prisma.changeLog.findMany({
      take: 500,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, fullName: true, email: true, avatarUrl: true, userType: true },
        },
      },
    });

    const entries: LogEntry[] = records.map((record) => ({
      id: record.id,
      tableName: record.tableName,
      recordId: record.recordId,
      action: record.action,
      createdAt: record.createdAt ? record.createdAt.toISOString() : null,
      changes: (record.changes as Record<string, unknown> | null) ?? null,
      metadata: (record.metadata as Record<string, unknown> | null) ?? null,
      user: record.user,
    }));

    return NextResponse.json({ entries }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to load the activity log.' },
      { status: 500 },
    );
  }
}
