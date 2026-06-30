import { NextResponse } from 'next/server';

import { executeMemoryIngest, startReviewMemoryIngest } from '@/lib/memory/execute-ingest';
import { MEMORY_WORKFLOW_INGEST_NAME, MEMORY_WORKFLOW_INGEST_REVIEW_NAME } from '@/lib/memory/constants';

export async function POST(req: Request) {
  const body = (await req.json()) as {
    text?: string;
    scopeKind?: 'global' | 'agent' | 'group';
    scopeId?: string;
    sourceKind?: string;
    partition?: string;
    agentId?: string;
    useReviewWorkflow?: boolean;
  };

  const text = body.text?.trim();
  if (!text) {
    return NextResponse.json({ error: 'text is required' }, { status: 400 });
  }

  const inputPayload = {
    text,
    scopeKind: body.scopeKind ?? 'global',
    scopeId: body.scopeId,
    sourceKind: body.sourceKind ?? 'domain',
    partition: body.partition,
    agentId: body.agentId ?? body.scopeId ?? 'default',
  };

  try {
    if (body.useReviewWorkflow) {
      const review = await startReviewMemoryIngest({ inputPayload });
      return NextResponse.json({
        ok: true,
        mode: review.mode,
        workflowRunId: review.workflowRunId,
        workflowId: review.workflowId,
        workflowName: MEMORY_WORKFLOW_INGEST_REVIEW_NAME,
        threadId: review.threadId,
        status: review.status,
        interrupt: review.interrupt,
        message: review.message,
      });
    }

    const { workflow, workflowRunId, result } = await executeMemoryIngest({
      workflowName: MEMORY_WORKFLOW_INGEST_NAME,
      inputPayload,
    });

    return NextResponse.json({
      ok: true,
      mode: 'standard',
      workflowRunId,
      workflowId: workflow.id,
      workflowName: workflow.name,
      state: result.state,
      events: result.events.map((e) => e.node),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Ingest failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}