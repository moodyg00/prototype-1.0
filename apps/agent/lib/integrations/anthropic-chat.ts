import type { ChatMessage, ChatResult, ToolCall } from './chat-types';

type AnthropicTool = {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
};

function toAnthropicMessages(messages: ChatMessage[]) {
  const out: Array<{ role: 'user' | 'assistant'; content: unknown }> = [];
  for (const m of messages) {
    if (m.role === 'user') {
      out.push({ role: 'user', content: m.content });
    } else if (m.role === 'assistant') {
      if (m.toolCalls?.length) {
        out.push({
          role: 'assistant',
          content: [
            ...(m.content ? [{ type: 'text', text: m.content }] : []),
            ...m.toolCalls.map((tc) => ({
              type: 'tool_use',
              id: tc.id,
              name: tc.name,
              input: tc.args,
            })),
          ],
        });
      } else {
        out.push({ role: 'assistant', content: m.content });
      }
    } else if (m.role === 'tool') {
      out.push({
        role: 'user',
        content: [{ type: 'tool_result', tool_use_id: m.toolCallId, content: m.content }],
      });
    }
  }
  return out;
}

function parseAnthropicResponse(content: unknown): { text: string; reasoning?: string; toolCalls: ToolCall[] } {
  const blocks = Array.isArray(content) ? content : [];
  let text = '';
  let reasoning = '';
  const toolCalls: ToolCall[] = [];

  for (const block of blocks) {
    const b = block as { type?: string; text?: string; id?: string; name?: string; input?: Record<string, unknown> };
    if (b.type === 'text' && b.text) text += b.text;
    if (b.type === 'thinking' && b.text) reasoning += b.text;
    if (b.type === 'tool_use' && b.name) {
      toolCalls.push({
        id: b.id ?? '',
        name: b.name,
        args: b.input ?? {},
      });
    }
  }

  return { text, reasoning: reasoning || undefined, toolCalls };
}

export async function invokeAnthropicChat(opts: {
  apiKey: string;
  model: string;
  systemPrompt: string;
  messages: ChatMessage[];
  tools?: AnthropicTool[];
  maxTokens?: number;
  signal?: AbortSignal;
}): Promise<ChatResult> {
  const body: Record<string, unknown> = {
    model: opts.model,
    max_tokens: opts.maxTokens ?? 8192,
    system: opts.systemPrompt,
    messages: toAnthropicMessages(opts.messages),
  };
  if (opts.tools?.length) {
    body.tools = opts.tools;
  }

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': opts.apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    signal: opts.signal,
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Anthropic error ${res.status}: ${txt.slice(0, 500)}`);
  }

  const json = (await res.json()) as {
    content?: unknown;
    usage?: { input_tokens?: number; output_tokens?: number };
  };
  const parsed = parseAnthropicResponse(json.content);
  const tokens = (json.usage?.input_tokens ?? 0) + (json.usage?.output_tokens ?? 0);

  return {
    content: parsed.text,
    reasoningContent: parsed.reasoning,
    toolCalls: parsed.toolCalls,
    totalTokens: tokens,
  };
}
