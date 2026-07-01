import type { StructuredToolInterface } from '@langchain/core/tools';

import { langChainToolsToOpenAi, toolSchemaToOpenAiParameters } from './chat-tools';
import type { ChatMessage, ChatResult, ReasoningEffort } from './chat-types';
import { invokeOpenAiCompatibleChat } from './openai-compatible-chat';
import { XAI_BASE_URL } from './xai';

export type XaiChatMessage = ChatMessage;
export type XaiToolDefinition = {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
};
export type XaiToolCall = { id: string; name: string; args: Record<string, unknown> };
export type XaiChatResult = ChatResult & { rawMessage?: Record<string, unknown> };

export { langChainToolsToOpenAi, toolSchemaToOpenAiParameters };

/** @deprecated Prefer invokeIdeChat — direct xAI chat/completions for legacy callers. */
export async function invokeXaiChat(opts: {
  apiKey: string;
  model: string;
  messages: XaiChatMessage[];
  tools?: XaiToolDefinition[];
  reasoningEffort?: ReasoningEffort;
  signal?: AbortSignal;
}): Promise<XaiChatResult> {
  const system = opts.messages.find((m) => (m as { role?: string }).role === 'system');
  const systemPrompt =
    system && 'content' in system && typeof system.content === 'string' ? system.content : '';
  const thread = opts.messages.filter((m) => (m as { role?: string }).role !== 'system') as ChatMessage[];

  const result = await invokeOpenAiCompatibleChat({
    apiKey: opts.apiKey,
    baseUrl: XAI_BASE_URL,
    model: opts.model,
    systemPrompt,
    messages: thread,
    tools: opts.tools,
    reasoningEffort: opts.reasoningEffort,
    signal: opts.signal,
  });
  return { ...result, rawMessage: undefined };
}
