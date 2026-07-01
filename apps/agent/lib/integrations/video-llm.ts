import {
  IMAGE_MODEL_OPTIONS,
  isImageProviderConfigured,
  normalizeVideoProductionSettings,
  resolveVideoModel,
  VIDEO_MODEL_OPTIONS,
  type VideoModelOption,
  type VideoProductionSettings,
} from '@prototype/ide-tools';

import { isIdeProviderConfigured, resolveOpenAiApiKey } from './ide-llm';
import { resolveXaiApiKey } from './xai';
import { randomUUID } from 'node:crypto';

export async function isVideoModelProviderConfigured(
  provider: VideoModelOption['provider'],
): Promise<boolean> {
  if (provider === 'xai') return Boolean(await resolveXaiApiKey());
  if (provider === 'openai') return Boolean(await resolveOpenAiApiKey());
  if (provider === 'runway') return Boolean(process.env.RUNWAY_API_KEY?.trim());
  if (provider === 'luma') return Boolean(process.env.LUMA_API_KEY?.trim());
  if (provider === 'anthropic') return isIdeProviderConfigured('anthropic');
  if (provider === 'stability' || provider === 'replicate') {
    return isImageProviderConfigured(provider, {
      xai: async () => false,
      openai: async () => false,
      anthropic: async () => false,
      stability: async () => Boolean(process.env.STABILITY_API_KEY?.trim()),
      replicate: async () => Boolean(process.env.REPLICATE_API_TOKEN?.trim()),
    });
  }
  return false;
}

export async function listVideoModelsWithConfig() {
  return Promise.all(
    VIDEO_MODEL_OPTIONS.map(async (m) => ({
      ...m,
      configured: await isVideoModelProviderConfigured(m.provider),
    })),
  );
}

/** Tiny valid MP4 (blank / minimal) for offline scaffold. */
function stubMp4Buffer(): Buffer {
  return Buffer.from(
    'AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAAIZnJlZQAAAB1tZGF0AAAAFGJ0eXAAAAAAAAAAAQAAAAEAAAAAAA==',
    'base64',
  );
}

async function tryProviderGenerate(
  model: VideoModelOption,
  prompt: string,
  _settings: VideoProductionSettings,
): Promise<Buffer | null> {
  if (model.provider === 'openai') {
    const key = await resolveOpenAiApiKey();
    if (!key) return null;
    const res = await fetch('https://api.openai.com/v1/videos/generations', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model.id === 'sora-2' ? 'sora-2' : model.id,
        prompt,
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { data?: Array<{ b64_json?: string; url?: string }> };
    const b64 = data.data?.[0]?.b64_json;
    if (b64) return Buffer.from(b64, 'base64');
  }
  return null;
}

export async function generateVideoForProduction(opts: {
  modelId?: string | null;
  prompt: string;
  settings?: Partial<VideoProductionSettings>;
}): Promise<{
  buffer: Buffer;
  mimeType: string;
  generationId: string;
  stub: boolean;
  settings: VideoProductionSettings;
}> {
  const settings = normalizeVideoProductionSettings(opts.settings);
  const model = resolveVideoModel(opts.modelId);
  const generationId = randomUUID();

  const fromProvider = await tryProviderGenerate(model, opts.prompt, settings);
  if (fromProvider) {
    return {
      buffer: fromProvider,
      mimeType: 'video/mp4',
      generationId,
      stub: false,
      settings,
    };
  }

  void IMAGE_MODEL_OPTIONS;
  return {
    buffer: stubMp4Buffer(),
    mimeType: 'video/mp4',
    generationId,
    stub: true,
    settings,
  };
}