import { NextResponse } from 'next/server';

import { runTimelineSync } from '@/lib/video/timeline-render-service';
import { isFfmpegAvailable } from '@/lib/video/ffmpeg-pipeline';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { agentId?: string; projectId?: string };
    const agentId = body.agentId ?? 'default';
    const projectId = body.projectId ?? 'default';
    const project = await runTimelineSync(agentId, projectId);
    const ffmpeg = await isFfmpegAvailable();
    return NextResponse.json({ project, ffmpeg });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Sync failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}