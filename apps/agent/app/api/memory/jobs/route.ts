import { NextResponse } from 'next/server';

import { MEMORY_WORKFLOW_NAME_PREFIXES } from '@/lib/memory/constants';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const limit = Math.min(Number(url.searchParams.get('limit') ?? 50) || 50, 200);

  const runs = await prisma.workflowRun.findMany({
    where: {
      OR: MEMORY_WORKFLOW_NAME_PREFIXES.map((prefix) => ({
        workflowName: { startsWith: prefix },
      })),
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      workflowId: true,
      workflowName: true,
      status: true,
      durationMs: true,
      eventCount: true,
      errorText: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ runs, count: runs.length });
}