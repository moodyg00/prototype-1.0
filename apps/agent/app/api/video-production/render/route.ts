import { NextResponse } from 'next/server';

import { runTimelineRender } from '@/lib/video/timeline-render-service';
import {
  listVideoProductionJobs,
  pushVideoProductionJob,
  updateVideoProductionJob,
} from '@/lib/media/video-production-jobs';
import { getTimeline } from '@/lib/video/timeline-store';
import { randomUUID } from 'node:crypto';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const jobId = randomUUID();
  try {
    const body = (await request.json()) as { agentId?: string; projectId?: string };
    const agentId = body.agentId ?? 'default';
    const projectId = body.projectId ?? 'default';
    const project = await getTimeline(agentId, projectId);

    pushVideoProductionJob({
      id: jobId,
      agentId,
      modelId: 'timeline-render',
      prompt: `Render: ${project.name}`,
      status: 'syncing',
      settings: project.settings,
      createdAt: new Date().toISOString(),
      progress: 20,
    });

    const result = await runTimelineRender(agentId, projectId);

    updateVideoProductionJob(jobId, {
      status: 'done',
      mediaId: result.item?.id,
      progress: 100,
    });

    return NextResponse.json({
      ...result,
      job: listVideoProductionJobs(agentId).find((j) => j.id === jobId),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Render failed';
    updateVideoProductionJob(jobId, { status: 'failed', error: message });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}