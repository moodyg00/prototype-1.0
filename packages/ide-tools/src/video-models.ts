import type { ImageLlmProvider } from './model-registry';
import type { VideoProductionSettings } from './video-production-params';
import { DEFAULT_VIDEO_PRODUCTION_SETTINGS } from './video-production-params';

export type VideoModelCapability = 'text2video' | 'img2video' | 'video2video' | 'extend' | 'edit';

export type VideoModelOption = {
  id: string;
  label: string;
  provider: ImageLlmProvider | 'runway' | 'luma';
  description: string;
  capabilities: VideoModelCapability[];
  maxDurationSeconds: number;
};

export const VIDEO_MODEL_OPTIONS: VideoModelOption[] = [
  {
    id: 'grok-video',
    label: 'Grok Video',
    provider: 'xai',
    description: 'xAI video when API supports generation',
    capabilities: ['text2video', 'img2video'],
    maxDurationSeconds: 10,
  },
  {
    id: 'sora-2',
    label: 'Sora 2',
    provider: 'openai',
    description: 'OpenAI video (OPENAI_API_KEY)',
    capabilities: ['text2video', 'img2video', 'extend'],
    maxDurationSeconds: 20,
  },
  {
    id: 'veo-3',
    label: 'Veo 3',
    provider: 'openai',
    description: 'Google Veo via partner APIs (stub catalog)',
    capabilities: ['text2video'],
    maxDurationSeconds: 15,
  },
  {
    id: 'runway-gen4',
    label: 'Runway Gen-4',
    provider: 'runway',
    description: 'Runway (RUNWAY_API_KEY)',
    capabilities: ['text2video', 'img2video', 'video2video'],
    maxDurationSeconds: 10,
  },
  {
    id: 'luma-dream',
    label: 'Luma Dream Machine',
    provider: 'luma',
    description: 'Luma (LUMA_API_KEY)',
    capabilities: ['text2video', 'img2video'],
    maxDurationSeconds: 5,
  },
];

export const DEFAULT_VIDEO_MODEL_ID = 'grok-video';
export const DEFAULT_BACKUP_VIDEO_MODEL_ID = 'sora-2';

export function resolveVideoModel(modelId?: string | null): VideoModelOption {
  const id = modelId?.trim() || DEFAULT_VIDEO_MODEL_ID;
  return VIDEO_MODEL_OPTIONS.find((m) => m.id === id) ?? VIDEO_MODEL_OPTIONS[0]!;
}

export type AgentVideoModelPrefs = {
  defaultModelId: string;
  backupModelId: string;
  pinnedModelIds: string[];
  productionDefaults: VideoProductionSettings;
};

export const DEFAULT_AGENT_VIDEO_MODEL_PREFS: AgentVideoModelPrefs = {
  defaultModelId: DEFAULT_VIDEO_MODEL_ID,
  backupModelId: DEFAULT_BACKUP_VIDEO_MODEL_ID,
  pinnedModelIds: [],
  productionDefaults: DEFAULT_VIDEO_PRODUCTION_SETTINGS,
};