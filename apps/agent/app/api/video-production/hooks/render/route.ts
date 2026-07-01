import { NextResponse } from 'next/server';

import { assertVideoHookSecret } from '@/lib/video/hook-auth';
import { enqueueRender } from '@/lib/video/render-queue';

export const runtime = 'nodejs';

/**
 * Webhook to queue a timeline render (optional VIDEO_WEBHOOK_SECRET).
 * POST /api/video-production/hooks/render
 */
export async function POST(req: Request) {
  try {
    assertVideoHookSecret(req);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await req.json()) as {
    agentId?: string;
    projectId?: string;
    callbackUrl?: string;
  };

  const job = await enqueueRender({
    agentId: body.agentId ?? 'default',
    projectId: body.projectId ?? 'default',
    webhookUrl: body.callbackUrl,
  });

  return NextResponse.json({ ok: true, jobId: job.id, status: job.status });
}