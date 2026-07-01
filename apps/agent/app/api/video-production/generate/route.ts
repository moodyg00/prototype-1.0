import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';

import { generateVideoForProduction } from '@/lib/integrations/video-llm';
import { saveGeneratedVideoBuffer } from '@/lib/media/agent-media-service';
import {
  listVideoProductionJobs,
  pushVideoProductionJob,
  updateVideoProductionJob,
} from '@/lib/media/video-production-jobs';
import { normalizeVideoProductionSettings, type VideoProductionSettings } from '@prototype/ide-tools';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const jobId = randomUUID();
  try {
    const body = (await request.json()) as {
      prompt?: string;
      modelId?: string;
      agentId?: string;
      settings?: Partial<VideoProductionSettings>;
    };
    const prompt = body.prompt?.trim();
    if (!prompt) {
      return NextResponse.json({ error: 'prompt is required' }, { status: 400 });
    }
    const agentId = (body.agentId ?? 'default').trim();
    const settings = normalizeVideoProductionSettings(body.settings);

    pushVideoProductionJob({
      id: jobId,
      agentId,
      modelId: body.modelId ?? 'grok-video',
      prompt,
      status: 'running',
      settings,
      createdAt: new Date().toISOString(),
      progress: 10,
    });

    updateVideoProductionJob(jobId, { status: 'syncing', progress: 45 });

    const gen = await generateVideoForProduction({
      modelId: body.modelId,
      prompt,
      settings,
    });

    const item = await saveGeneratedVideoBuffer({
      buffer: gen.buffer,
      mimeType: gen.mimeType,
      agentId,
      prompt,
      generationId: gen.generationId,
      settings: gen.settings,
    });

    updateVideoProductionJob(jobId, {
      status: 'done',
      mediaId: item?.id,
      stub: gen.stub,
      progress: 100,
    });

    return NextResponse.json({
      job: listVideoProductionJobs(agentId).find((j) => j.id === jobId),
      item,
      stub: gen.stub,
      settings: gen.settings,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Generation failed';
    updateVideoProductionJob(jobId, { status: 'failed', error: message });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}