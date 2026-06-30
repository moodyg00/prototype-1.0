import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

export async function GET() {
  type GroupRow = { scopeKind: string; scopeId: string | null; _count: { _all: number } };
  const grouped = (await prisma.memoryChunk.groupBy({
    by: ['scopeKind', 'scopeId'],
    _count: { _all: true },
  })) as GroupRow[];

  grouped.sort((a: GroupRow, b: GroupRow) => b._count._all - a._count._all);

  const scopes = grouped.slice(0, 50).map((g: GroupRow) => ({
    scopeKind: g.scopeKind,
    scopeId: g.scopeId,
    count: g._count._all,
  }));

  return NextResponse.json({ scopes, count: scopes.length });
}