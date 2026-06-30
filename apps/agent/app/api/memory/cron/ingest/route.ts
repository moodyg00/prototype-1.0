import { NextResponse } from 'next/server';

import { assertMemoryCronSecret } from '@/lib/memory/hook-auth';
import { executeMemoryIngest } from '@/lib/memory/execute-ingest';
import { MEMORY_WORKFLOW_TURN_CAPTURE_NAME } from '@/lib/memory/constants';

/**
 * Schedule/cron entry — batch turn or text ingest (pairs with trigger.schedule metadata).
 * POST /api/memory/cron/ingest
 */
export async function POST(req: Request) {
  try {
    assertMemoryCronSecret(req);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unauthorized';
    const status = message.includes('not configured') ? 503 : 401;
    return NextResponse.json({ error: message }, { status });
  }

  const body = (await req.json().catch(() => ({}))) as {
    batches?: Array<{
      text: string;
      agentId?: string;
      scopeKind?: 'global' | 'agent' | 'group';
      scopeId?: string;
      sourceKind?: string;
    }>;
  };

  const batches = body.batches?.length
    ? body.batches
    : [{ text: 'Scheduled memory tick (no batches in payload)', agentId: 'default', sourceKind: 'turn' }];

  const results: Array<{ ok: boolean; workflowRunId?: string; error?: string }> = [];

  for (const batch of batches) {
    const text = batch.text?.trim();
    if (!text) {
      results.push({ ok: false, error: 'empty text' });
      continue;
    }
    const agentId = batch.agentId ?? batch.scopeId ?? 'default';
    try {
      const { workflowRunId } = await executeMemoryIngest({
        workflowName: MEMORY_WORKFLOW_TURN_CAPTURE_NAME,
        runLabel: `cron:${agentId}`,
        inputPayload: {
          text,
          scopeKind: batch.scopeKind ?? 'agent',
          scopeId: batch.scopeId ?? agentId,
          sourceKind: batch.sourceKind ?? 'turn',
          agentId,
        },
      });
      results.push({ ok: true, workflowRunId });
    } catch (error: unknown) {
      results.push({ ok: false, error: error instanceof Error ? error.message : 'failed' });
    }
  }

  return NextResponse.json({ ok: true, count: results.length, results });
}