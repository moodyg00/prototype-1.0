import { NextResponse } from 'next/server';

import { assertMemoryHookSecret } from '@/lib/memory/hook-auth';
import { captureTurnToMemory, executeMemoryIngest } from '@/lib/memory/execute-ingest';
import { MEMORY_WORKFLOW_TURN_CAPTURE_NAME, MEMORY_WORKFLOW_INGEST_NAME } from '@/lib/memory/constants';

/**
 * Webhook entry for memory automations (pairs with trigger.webhook in designer metadata).
 * POST /api/memory/hooks/ingest
 */
export async function POST(req: Request) {
  try {
    assertMemoryHookSecret(req);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await req.json()) as {
    text?: string;
    agentId?: string;
    scopeKind?: 'global' | 'agent' | 'group';
    scopeId?: string;
    sourceKind?: string;
    mode?: 'ingest' | 'turn';
  };

  const text = body.text?.trim();
  if (!text) {
    return NextResponse.json({ error: 'text is required' }, { status: 400 });
  }

  const agentId = body.agentId ?? body.scopeId ?? 'default';
  const scopeKind = body.scopeKind ?? 'agent';
  const scopeId = body.scopeId ?? agentId;

  try {
    if (body.mode === 'turn') {
      const { workflowRunId } = await captureTurnToMemory({
        agentId,
        input: text,
        output: '(webhook turn)',
      });
      return NextResponse.json({
        ok: true,
        mode: 'turn',
        workflowName: MEMORY_WORKFLOW_TURN_CAPTURE_NAME,
        workflowRunId,
      });
    }

    const { workflow, workflowRunId, result } = await executeMemoryIngest({
      workflowName: MEMORY_WORKFLOW_INGEST_NAME,
      inputPayload: {
        text,
        scopeKind,
        scopeId,
        agentId,
        sourceKind: body.sourceKind ?? 'domain',
      },
    });

    return NextResponse.json({
      ok: true,
      mode: 'ingest',
      workflowName: workflow.name,
      workflowRunId,
      chunkCount:
        (result.state.memory as { lastIngest?: { count?: number } } | undefined)?.lastIngest?.count ??
        null,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Hook ingest failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}