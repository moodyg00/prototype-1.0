import {
  IMAGE_MODEL_OPTIONS,
  resolveImageApiModelId,
  resolveImageModel,
  type ImageModelOption,
} from '@prototype/ide-tools/image-models';
import { isImageProviderConfigured } from '@prototype/ide-tools/model-registry';

import { isIdeProviderConfigured, resolveOpenAiApiKey } from './ide-llm';
import { resolveXaiApiKey, XAI_BASE_URL } from './xai';

export async function isImageModelProviderConfigured(
  provider: ImageModelOption['provider'],
): Promise<boolean> {
  return isImageProviderConfigured(provider, {
    xai: async () => Boolean(await resolveXaiApiKey()),
    openai: async () => Boolean(await resolveOpenAiApiKey()),
    anthropic: async () => isIdeProviderConfigured('anthropic'),
    stability: async () => Boolean(process.env.STABILITY_API_KEY?.trim()),
    replicate: async () => Boolean(process.env.REPLICATE_API_TOKEN?.trim()),
  });
}

export async function listImageModelsWithConfig() {
  return Promise.all(
    IMAGE_MODEL_OPTIONS.map(async (m) => ({
      ...m,
      configured: await isImageModelProviderConfigured(m.provider),
    })),
  );
}

/** Minimal 256×256 PNG placeholder when no provider is available. */
function stubPngBuffer(): Buffer {
  // 1×1 transparent PNG
  return Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64',
  );
}

async function generateWithXai(
  prompt: string,
  apiKey: string,
  apiModelId: string,
): Promise<Buffer> {
  const res = await fetch(`${XAI_BASE_URL}/images/generations`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: apiModelId,
      prompt,
      n: 1,
      response_format: 'b64_json',
    }),
  });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const err = (await res.json()) as { error?: string; message?: string };
      detail = err.error ?? err.message ?? detail;
    } catch {
      /* ignore parse errors */
    }
    throw new Error(`xAI image generation failed (${res.status}): ${detail}`);
  }
  const data = (await res.json()) as {
    data?: Array<{ b64_json?: string; url?: string }>;
  };
  const b64 = data.data?.[0]?.b64_json;
  if (b64) return Buffer.from(b64, 'base64');

  const url = data.data?.[0]?.url;
  if (url) {
    const imageRes = await fetch(url);
    if (!imageRes.ok) {
      throw new Error(`xAI image download failed (${imageRes.status})`);
    }
    return Buffer.from(await imageRes.arrayBuffer());
  }

  throw new Error('xAI image generation returned no image data');
}

async function generateWithOpenAi(prompt: string, apiKey: string, modelId: string): Promise<Buffer | null> {
  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: modelId === 'dall-e-3' ? 'dall-e-3' : modelId,
      prompt,
      n: 1,
      size: '1024x1024',
      response_format: 'b64_json',
    }),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { data?: Array<{ b64_json?: string }> };
  const b64 = data.data?.[0]?.b64_json;
  if (!b64) return null;
  return Buffer.from(b64, 'base64');
}

export async function generateImageForPhotography(opts: {
  modelId?: string | null;
  prompt: string;
}): Promise<{ buffer: Buffer; mimeType: string; generationId: string; stub: boolean }> {
  const model = resolveImageModel(opts.modelId);
  const generationId = crypto.randomUUID();

  if (model.provider === 'xai') {
    const key = await resolveXaiApiKey();
    if (key) {
      const buf = await generateWithXai(opts.prompt, key, resolveImageApiModelId(model));
      return { buffer: buf, mimeType: 'image/png', generationId, stub: false };
    }
  }

  if (model.provider === 'openai') {
    const key = await resolveOpenAiApiKey();
    if (key) {
      const buf = await generateWithOpenAi(opts.prompt, key, model.id);
      if (buf) return { buffer: buf, mimeType: 'image/png', generationId, stub: false };
    }
  }

  return { buffer: stubPngBuffer(), mimeType: 'image/png', generationId, stub: true };
}