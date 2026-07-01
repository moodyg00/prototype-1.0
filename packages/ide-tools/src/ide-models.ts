export type IdeLlmProvider = 'xai' | 'anthropic' | 'openai';

export type IdeModelOption = {
  id: string;
  label: string;
  provider: IdeLlmProvider;
  description: string;
  /** Provider max context window in tokens (for chat metadata display). */
  contextWindowTokens: number;
};

/** Curated models for the public-dev IDE agent (ReAct + file tools). */
export const IDE_MODEL_OPTIONS: IdeModelOption[] = [
  {
    id: 'grok-4.3',
    label: 'Grok 4.3',
    provider: 'xai',
    description: 'Default — fast reasoning + tool traces via xAI',
    contextWindowTokens: 131_072,
  },
  {
    id: 'claude-sonnet-4-6',
    label: 'Claude Sonnet 4.6',
    provider: 'anthropic',
    description: 'Balanced quality and speed for HTML/CSS edits',
    contextWindowTokens: 200_000,
  },
  {
    id: 'claude-opus-4-8',
    label: 'Claude Opus 4.8',
    provider: 'anthropic',
    description: 'Highest quality for complex multi-file refactors',
    contextWindowTokens: 200_000,
  },
  {
    id: 'gpt-5.1-codex',
    label: 'GPT-5.1 Codex',
    provider: 'openai',
    description: 'OpenAI agentic coding model',
    contextWindowTokens: 192_000,
  },
  {
    id: 'gpt-5.1-codex-mini',
    label: 'GPT-5.1 Codex Mini',
    provider: 'openai',
    description: 'Lighter Codex variant for faster iterations',
    contextWindowTokens: 192_000,
  },
];

/** Retired Anthropic snapshot ids → current replacements (localStorage / old chats). */
const IDE_MODEL_ALIASES: Record<string, string> = {
  'claude-sonnet-4-20250514': 'claude-sonnet-4-6',
  'claude-opus-4-20250514': 'claude-opus-4-8',
};

export const DEFAULT_IDE_MODEL_ID = 'grok-4.3';

export function normalizeIdeModelId(modelId?: string | null): string {
  const raw = modelId?.trim() || DEFAULT_IDE_MODEL_ID;
  return IDE_MODEL_ALIASES[raw] ?? raw;
}

export function resolveIdeModel(modelId?: string | null): IdeModelOption {
  const id = normalizeIdeModelId(modelId);
  return IDE_MODEL_OPTIONS.find((m) => m.id === id) ?? IDE_MODEL_OPTIONS[0]!;
}

export function ideModelStorageKey(slug?: string | null): string {
  return slug ? `public-dev:ide-agent-model:${slug}` : 'public-dev:ide-agent-model';
}
