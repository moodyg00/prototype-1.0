import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';

import { generateImageForPhotography } from '@/lib/integrations/image-llm';
import { saveGeneratedImageBuffer } from '@/lib/media/agent-media-service';
import {
  listPhotographyJobs,
  pushPhotographyJob,
  updatePhotographyJob,
} from '@/lib/media/photography-jobs';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const jobId = randomUUID();
  try {
    const body = (await request.json()) as {
      prompt?: string;
      modelId?: string;
      agentId?: string;
    };
    const prompt = body.prompt?.trim();
    if (!prompt) {
      return NextResponse.json({ error: 'prompt is required' }, { status: 400 });
    }
    const agentId = (body.agentId ?? 'default').trim();
    const modelId = body.modelId ?? undefined;

    pushPhotographyJob({
      id: jobId,
      agentId,
      modelId: modelId ?? 'grok-imagine',
      prompt,
      status: 'running',
      createdAt: new Date().toISOString(),
    });

    const gen = await generateImageForPhotography({ modelId, prompt });
    const item = await saveGeneratedImageBuffer({
      buffer: gen.buffer,
      mimeType: gen.mimeType,
      agentId,
      prompt,
      generationId: gen.generationId,
    });

    updatePhotographyJob(jobId, {
      status: 'done',
      mediaId: item?.id,
      stub: gen.stub,
    });

    return NextResponse.json({
      job: listPhotographyJobs(agentId).find((j) => j.id === jobId),
      item,
      stub: gen.stub,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Generation failed';
    updatePhotographyJob(jobId, { status: 'failed', error: message });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}