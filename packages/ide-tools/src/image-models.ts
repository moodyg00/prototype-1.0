import type { ImageLlmProvider } from './model-registry';

export type ImageModelCapability = 'text2img' | 'img2img' | 'edit';

export type ImageModelOption = {
  id: string;
  label: string;
  provider: ImageLlmProvider;
  description: string;
  capabilities: ImageModelCapability[];
};

/** Curated image models for Photography studio (extend over time). */
export const IMAGE_MODEL_OPTIONS: ImageModelOption[] = [
  {
    id: 'grok-imagine',
    label: 'Grok Imagine',
    provider: 'xai',
    description: 'xAI image generation when XAI_API_KEY is set',
    capabilities: ['text2img', 'img2img', 'edit'],
  },
  {
    id: 'dall-e-3',
    label: 'DALL·E 3',
    provider: 'openai',
    description: 'OpenAI image API',
    capabilities: ['text2img', 'edit'],
  },
  {
    id: 'gpt-image-1',
    label: 'GPT Image 1',
    provider: 'openai',
    description: 'OpenAI multimodal image model',
    capabilities: ['text2img', 'img2img', 'edit'],
  },
  {
    id: 'stable-image-ultra',
    label: 'Stable Image Ultra',
    provider: 'stability',
    description: 'Stability AI (STABILITY_API_KEY)',
    capabilities: ['text2img'],
  },
];

export const DEFAULT_IMAGE_MODEL_ID = 'grok-imagine';
export const DEFAULT_BACKUP_IMAGE_MODEL_ID = 'dall-e-3';

export function resolveImageModel(modelId?: string | null): ImageModelOption {
  const id = modelId?.trim() || DEFAULT_IMAGE_MODEL_ID;
  return IMAGE_MODEL_OPTIONS.find((m) => m.id === id) ?? IMAGE_MODEL_OPTIONS[0]!;
}

export type AgentImageModelPrefs = {
  defaultModelId: string;
  backupModelId: string;
  pinnedModelIds: string[];
};

export const DEFAULT_AGENT_IMAGE_MODEL_PREFS: AgentImageModelPrefs = {
  defaultModelId: DEFAULT_IMAGE_MODEL_ID,
  backupModelId: DEFAULT_BACKUP_IMAGE_MODEL_ID,
  pinnedModelIds: [],
};