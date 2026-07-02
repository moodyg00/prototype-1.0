import type { IdeLlmProvider } from './ide-models';

export type ImageLlmProvider = IdeLlmProvider | 'stability' | 'replicate';

export async function isImageProviderConfigured(
  provider: ImageLlmProvider,
  checks: {
    xai: () => Promise<boolean>;
    openai: () => Promise<boolean>;
    anthropic: () => Promise<boolean>;
    openrouter?: () => Promise<boolean>;
    stability?: () => Promise<boolean>;
    replicate?: () => Promise<boolean>;
  },
): Promise<boolean> {
  if (provider === 'xai') return checks.xai();
  if (provider === 'openai') return checks.openai();
  if (provider === 'anthropic') return checks.anthropic();
  if (provider === 'openrouter') return checks.openrouter?.() ?? false;
  if (provider === 'stability') return checks.stability?.() ?? false;
  if (provider === 'replicate') return checks.replicate?.() ?? false;
  return false;
}