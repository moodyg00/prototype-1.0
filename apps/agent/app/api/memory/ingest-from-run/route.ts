import { NextResponse } from 'next/server';

import { executeMemoryIngest } from '@/lib/memory/execute-ingest';
import { prisma } from '@/lib/prisma';

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

  const text = runToIngestText(run);
  const agentId = body.agentId ?? 'default';

  try {
    const { workflowRunId, result } = await executeMemoryIngest({
      runLabel: `ingest-from-run:${body.runId}`,
      inputPayload: {
        text,
        scopeKind: body.scopeKind ?? 'agent',
        scopeId: body.scopeId ?? agentId,
        sourceKind: 'thought',
        agentId,
      },
    });

    return NextResponse.json({
      ok: true,
      sourceRunId: body.runId,
      workflowRunId,
      chunkCount: (result.state.memory as { lastIngest?: { count: number } })?.lastIngest?.count ?? 0,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Ingest from run failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}