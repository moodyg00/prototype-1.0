import { NextResponse } from 'next/server';

import { MEMORY_WORKFLOW_INGEST_NAME, MEMORY_WORKFLOW_RECALL_NAME } from '@/lib/memory/constants';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const rows = await prisma.workflow.findMany({
    where: {
      name: { in: [MEMORY_WORKFLOW_INGEST_NAME, MEMORY_WORKFLOW_RECALL_NAME] },
    },
    select: { id: true, name: true, description: true, currentVersion: true },
  });

  type Row = (typeof rows)[number];
  const pick = (name: string) => rows.find((r: Row) => r.name === name) ?? null;

  return NextResponse.json({
    ingest: pick(MEMORY_WORKFLOW_INGEST_NAME),
    recall: pick(MEMORY_WORKFLOW_RECALL_NAME),
  });
}