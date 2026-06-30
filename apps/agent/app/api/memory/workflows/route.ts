import { NextResponse } from 'next/server';

import {
  MEMORY_WORKFLOW_AGENT_RAG_NAME,
  MEMORY_WORKFLOW_INGEST_NAME,
  MEMORY_WORKFLOW_RECALL_NAME,
  MEMORY_WORKFLOW_WEBHOOK_INGEST_NAME,
} from '@/lib/memory/constants';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
  const rows = await prisma.workflow.findMany({
    where: {
      name: {
        in: [
          MEMORY_WORKFLOW_INGEST_NAME,
          MEMORY_WORKFLOW_RECALL_NAME,
          MEMORY_WORKFLOW_AGENT_RAG_NAME,
          MEMORY_WORKFLOW_WEBHOOK_INGEST_NAME,
        ],
      },
    },
    select: { id: true, name: true, description: true, currentVersion: true },
  });

  type Row = (typeof rows)[number];
  const pick = (name: string) => rows.find((r: Row) => r.name === name) ?? null;

  return NextResponse.json({
    ingest: pick(MEMORY_WORKFLOW_INGEST_NAME),
    recall: pick(MEMORY_WORKFLOW_RECALL_NAME),
    agentRag: pick(MEMORY_WORKFLOW_AGENT_RAG_NAME),
    webhookIngest: pick(MEMORY_WORKFLOW_WEBHOOK_INGEST_NAME),
    hooks: {
      ingestUrl: '/api/memory/hooks/ingest',
      cronUrl: '/api/memory/cron/ingest',
    },
  });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load workflows';
    return NextResponse.json(
      {
        ingest: null,
        recall: null,
        agentRag: null,
        webhookIngest: null,
        hooks: {
          ingestUrl: '/api/memory/hooks/ingest',
          cronUrl: '/api/memory/cron/ingest',
        },
        error: message,
      },
      { status: 500 },
    );
  }
}