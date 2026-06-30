import { NextResponse } from 'next/server';

import { MEMORY_WORKFLOW_INGEST_NAME } from '@/lib/memory/constants';
import { prisma } from '@/lib/prisma';
import { runMemoryIngestWorkflow } from '@/lib/memory/run-ingest';

function runToIngestText(run: {
  workflowName: string;
  input: string | null;
  output: string | null;
  errorText: string | null;
  events: unknown;
  state: unknown;
}): string {
  const state = run.state as { memory?: Record<string, unknown> } | null;
  const events = (run.events as Array<{ node: string; update?: { output?: string } }>) ?? [];
  const timeline = events
    .map((e, i) => `${i + 1}. ${e.node}: ${(e.update?.output ?? '').slice(0, 400)}`)
    .join('\n');

  return [
    `# Workflow run trace: ${run.workflowName}`,
    '',
    '## Input',
    run.input ?? '',
    '',
    '## Output',
    run.output ?? run.errorText ?? '',
    '',
    '## Timeline',
    timeline,
    '',
    '## State memory snapshot',
    JSON.stringify(state?.memory ?? {}, null, 2).slice(0, 6000),
  ].join('\n');
}

export async function POST(req: Request) {
  const body = (await req.json()) as {
    runId?: string;
    agentId?: string;
    scopeKind?: 'global' | 'agent' | 'group';
    scopeId?: string;
  };

  if (!body.runId) {
    return NextResponse.json({ error: 'runId is required' }, { status: 400 });
  }

  const run = await prisma.workflowRun.findUnique({ where: { id: body.runId } });
  if (!run) {
    return NextResponse.json({ error: 'Run not found' }, { status: 404 });
  }

  const workflow = await prisma.workflow.findFirst({
    where: { name: MEMORY_WORKFLOW_INGEST_NAME },
    select: { id: true, name: true, currentVersion: true },
  });
  if (!workflow) {
    return NextResponse.json({ error: 'Ingest workflow not seeded' }, { status: 404 });
  }

  const text = runToIngestText(run);
  const agentId = body.agentId ?? 'default';
  const startedAt = Date.now();

  const pending = await prisma.workflowRun.create({
    data: {
      workflowId: workflow.id,
      workflowName: workflow.name,
      version: workflow.currentVersion,
      status: 'running',
      input: `ingest-from-run:${body.runId}`.slice(0, 8000),
      events: [],
      state: {},
    },
  });

  const input = JSON.stringify({
    text,
    scopeKind: body.scopeKind ?? 'agent',
    scopeId: body.scopeId ?? agentId,
    sourceKind: 'thought',
    agentId,
    workflowRunId: pending.id,
  });

  try {
    const { result } = await runMemoryIngestWorkflow(input);
    await prisma.workflowRun.update({
      where: { id: pending.id },
      data: {
        status: 'completed',
        output: (result.state.output ?? '').slice(0, 8000),
        threadId: pending.id,
        durationMs: Date.now() - startedAt,
        nodeCount: result.events.length,
        eventCount: result.events.length,
        tokens: 0,
        events: result.events as unknown as object,
        state: result.state as unknown as object,
      },
    });

    return NextResponse.json({
      ok: true,
      sourceRunId: body.runId,
      workflowRunId: pending.id,
      chunkCount: (result.state.memory as { lastIngest?: { count: number } })?.lastIngest?.count ?? 0,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Ingest from run failed';
    await prisma.workflowRun.update({
      where: { id: pending.id },
      data: { status: 'error', errorText: message.slice(0, 4000) },
    });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}