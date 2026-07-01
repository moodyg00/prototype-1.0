import { NextResponse } from 'next/server';

import { enqueueRender, getRenderJob, listRenderJobs } from '@/lib/video/render-queue';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const agentId = searchParams.get('agentId') ?? undefined;
  const jobId = searchParams.get('jobId');
  if (jobId) {
    const job = await getRenderJob(jobId);
    if (!job) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ job });
  }
  return NextResponse.json({ jobs: await listRenderJobs(agentId) });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      agentId?: string;
      projectId?: string;
      webhookUrl?: string;
    };
    const job = await enqueueRender({
      agentId: body.agentId ?? 'default',
      projectId: body.projectId,
      webhookUrl: body.webhookUrl,
    });
    return NextResponse.json({ job });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Enqueue failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}