import { NextResponse } from 'next/server';

import { MEMORY_WORKFLOW_INGEST_NAME } from '@/lib/memory/constants';
import { runMemoryIngestWorkflow } from '@/lib/memory/run-ingest';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const body = (await req.json()) as {
    text?: string;
    scopeKind?: 'global' | 'agent' | 'group';
    scopeId?: string;
    sourceKind?: string;
    partition?: string;
    agentId?: string;
  };

  const text = body.text?.trim();
  if (!text) {
    return NextResponse.json({ error: 'text is required' }, { status: 400 });
  }

  const workflow = await prisma.workflow.findFirst({
    where: { name: MEMORY_WORKFLOW_INGEST_NAME },
    select: { id: true, name: true, currentVersion: true },
  });

  if (!workflow) {
    return NextResponse.json(
      { error: `Workflow "${MEMORY_WORKFLOW_INGEST_NAME}" not found. Run seed-memory-workflows.ts` },
      { status: 404 },
    );
  }

  const startedAt = Date.now();
  const pending = await prisma.workflowRun.create({
    data: {
      workflowId: workflow.id,
      workflowName: workflow.name,
      version: workflow.currentVersion,
      status: 'running',
      input: text.slice(0, 8000),
      events: [],
      state: {},
    },
  });

  const input = JSON.stringify({
    text,
    scopeKind: body.scopeKind ?? 'global',
    scopeId: body.scopeId,
    sourceKind: body.sourceKind ?? 'domain',
    partition: body.partition,
    agentId: body.agentId ?? body.scopeId ?? 'default',
    workflowRunId: pending.id,
  });

  try {
    const { workflow: wf, result } = await runMemoryIngestWorkflow(input);

    await prisma.workflowRun.update({
      where: { id: pending.id },
      data: {
        status: 'completed',
        output: (result.state.output ?? '').slice(0, 8000),
        threadId: pending.id,
        durationMs: Date.now() - startedAt,
        nodeCount: result.events.length,
        eventCount: result.events.length,
        tokens: result.state.tokens ?? 0,
        events: result.events as unknown as object,
        state: result.state as unknown as object,
      },
    });

    return NextResponse.json({
      ok: true,
      workflowRunId: pending.id,
      workflowId: wf.id,
      workflowName: wf.name,
      state: result.state,
      events: result.events.map((e) => e.node),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Ingest failed';
    await prisma.workflowRun.update({
      where: { id: pending.id },
      data: { status: 'error', errorText: message.slice(0, 4000) },
    });
    return NextResponse.json({ error: message, workflowRunId: pending.id }, { status: 500 });
  }
}