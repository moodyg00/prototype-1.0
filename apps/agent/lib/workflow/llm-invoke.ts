import { HumanMessage, SystemMessage, type BaseMessage } from '@langchain/core/messages';
import { ChatOpenAI } from '@langchain/openai';

import { resolveXaiApiKey } from '@/lib/integrations/xai';

const XAI_BASE_URL = process.env.XAI_BASE_URL ?? 'https://api.x.ai/v1';

export async function invokeChatLlm(args: {
  model?: string;
  systemPrompt?: string;
  memoryContext?: string;
  input: string;
  messages?: BaseMessage[];
  temperature?: number;
}): Promise<{ text: string; tokens: number }> {
  const apiKey = process.env.XAI_API_KEY ?? (await resolveXaiApiKey());
  if (!apiKey) {
    throw new Error('No xAI credential configured for LLM run');
  }

  const model = new ChatOpenAI({
    model: args.model || 'grok-3-mini',
    temperature: args.temperature ?? 0.7,
    apiKey,
    configuration: { baseURL: XAI_BASE_URL },
  });

  const systemParts = [args.systemPrompt || 'You are a helpful assistant.'];
  if (args.memoryContext?.trim()) {
    systemParts.push('', '--- Retrieved memory ---', args.memoryContext.trim());
  }

  const history = args.messages ?? [];
  const prompt: BaseMessage[] = [new SystemMessage(systemParts.join('\n')), ...history];
  if (history.length === 0 && args.input) {
    prompt.push(new HumanMessage(args.input));
  }

  const response = await model.invoke(prompt);
  const text =
    typeof response.content === 'string' ? response.content : JSON.stringify(response.content);

  const usage = response as unknown as {
    usage_metadata?: { total_tokens?: number };
    response_metadata?: { tokenUsage?: { totalTokens?: number }; usage?: { total_tokens?: number } };
  };
  const tokens =
    usage.usage_metadata?.total_tokens ??
    usage.response_metadata?.tokenUsage?.totalTokens ??
    usage.response_metadata?.usage?.total_tokens ??
    0;

  return { text, tokens };
}