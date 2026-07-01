import type { IdeLlmProvider, IdeModelOption } from '@prototype/ide-tools';
import { resolveIdeModel } from '@prototype/ide-tools';

import { invokeAnthropicChat } from './anthropic-chat';
import type { ChatMessage, ChatResult, ReasoningEffort } from './chat-types';
import type { ToolDefinition } from './chat-types';
import { invokeOpenAiCompatibleChat } from './openai-compatible-chat';
import { resolveXaiApiKey, XAI_BASE_URL } from './xai';

export type { ChatMessage, ChatResult, ToolDefinition };

export async function resolveAnthropicApiKey(): Promise<string | null> {
  return process.env.ANTHROPIC_API_KEY?.trim() || null;
}

export async function resolveOpenAiApiKey(): Promise<string | null> {
  return process.env.OPENAI_API_KEY?.trim() || null;
}

export async function isIdeProviderConfigured(provider: IdeLlmProvider): Promise<boolean> {
  if (provider === 'xai') return Boolean(await resolveXaiApiKey());
  if (provider === 'anthropic') return Boolean(await resolveAnthropicApiKey());
  if (provider === 'openai') return Boolean(await resolveOpenAiApiKey());
  return false;
}

export async function resolveIdeProviderApiKey(provider: IdeLlmProvider): Promise<string | null> {
  if (provider === 'xai') return resolveXaiApiKey();
  if (provider === 'anthropic') return resolveAnthropicApiKey();
  if (provider === 'openai') return resolveOpenAiApiKey();
  return null;
}

export function missingIdeProviderMessage(model: IdeModelOption): string {
  const env =
    model.provider === 'xai'
      ? 'XAI_API_KEY'
      : model.provider === 'anthropic'
        ? 'ANTHROPIC_API_KEY'
        : 'OPENAI_API_KEY';
  return `No ${model.label} API key configured. Set ${env} in apps/agent/.env.local.`;
}

export async function invokeIdeChat(opts: {
  modelId?: string | null;
  systemPrompt: string;
  messages: ChatMessage[];
  tools?: ToolDefinition[];
  anthropicTools?: Array<{ name: string; description: string; input_schema: Record<string, unknown> }>;
  reasoningEffort?: ReasoningEffort;
  signal?: AbortSignal;
}): Promise<ChatResult & { model: IdeModelOption }> {
  const model = resolveIdeModel(opts.modelId);
  const apiKey = await resolveIdeProviderApiKey(model.provider);
  if (!apiKey) {
    throw new Error(missingIdeProviderMessage(model));
  }

  if (model.provider === 'anthropic') {
    const result = await invokeAnthropicChat({
      apiKey,
      model: model.id,
      systemPrompt: opts.systemPrompt,
      messages: opts.messages,
      tools: opts.anthropicTools,
      signal: opts.signal,
    });
    return { ...result, model };
  }

  if (model.provider === 'openai') {
    const result = await invokeOpenAiCompatibleChat({
      apiKey,
      baseUrl: process.env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1',
      model: model.id,
      systemPrompt: opts.systemPrompt,
      messages: opts.messages,
      tools: opts.tools,
      signal: opts.signal,
    });
    return { ...result, model };
  }

  const result = await invokeOpenAiCompatibleChat({
    apiKey,
    baseUrl: XAI_BASE_URL,
    model: model.id,
    systemPrompt: opts.systemPrompt,
    messages: opts.messages,
    tools: opts.tools,
    reasoningEffort: opts.reasoningEffort,
    signal: opts.signal,
  });
  return { ...result, model };
}
