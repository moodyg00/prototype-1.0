import type { ChatMessage, ChatResult, ReasoningEffort, ToolCall, ToolDefinition } from './chat-types';

function parseToolCalls(message: Record<string, unknown>): ToolCall[] {
  const raw = message.tool_calls;
  if (!Array.isArray(raw)) return [];
  return raw
    .map((tc) => {
      const fn = (tc as { id?: string; function?: { name?: string; arguments?: string } }).function;
      const id = (tc as { id?: string }).id ?? '';
      const name = fn?.name ?? '';
      let args: Record<string, unknown> = {};
      try {
        args = fn?.arguments ? (JSON.parse(fn.arguments) as Record<string, unknown>) : {};
      } catch {
        args = {};
      }
      return { id, name, args };
    })
    .filter((tc) => tc.name);
}

function toOpenAiMessages(systemPrompt: string, messages: ChatMessage[]) {
  const out: Array<Record<string, unknown>> = [{ role: 'system', content: systemPrompt }];
  for (const m of messages) {
    if (m.role === 'user') out.push({ role: 'user', content: m.content });
    else if (m.role === 'assistant') {
      out.push({
        role: 'assistant',
        content: m.content || null,
        ...(m.toolCalls?.length
          ? {
              tool_calls: m.toolCalls.map((tc) => ({
                id: tc.id,
                type: 'function',
                function: { name: tc.name, arguments: JSON.stringify(tc.args) },
              })),
            }
          : {}),
      });
    } else if (m.role === 'tool') {
      out.push({ role: 'tool', content: m.content, tool_call_id: m.toolCallId });
    }
  }
  return out;
}

/** OpenAI-compatible chat/completions (OpenAI, xAI, etc.). */
export async function invokeOpenAiCompatibleChat(opts: {
  apiKey: string;
  baseUrl: string;
  model: string;
  systemPrompt: string;
  messages: ChatMessage[];
  tools?: ToolDefinition[];
  reasoningEffort?: ReasoningEffort;
  signal?: AbortSignal;
}): Promise<ChatResult> {
  const body: Record<string, unknown> = {
    model: opts.model,
    messages: toOpenAiMessages(opts.systemPrompt, opts.messages),
  };
  if (opts.tools?.length) {
    body.tools = opts.tools;
    body.tool_choice = 'auto';
  }
  if (opts.reasoningEffort) {
    body.reasoning_effort = opts.reasoningEffort;
  }

  const res = await fetch(`${opts.baseUrl.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${opts.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    signal: opts.signal,
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Chat API error ${res.status}: ${txt.slice(0, 500)}`);
  }

  const json = (await res.json()) as {
    choices?: Array<{ message?: Record<string, unknown> }>;
    usage?: { total_tokens?: number };
  };
  const message = json.choices?.[0]?.message ?? {};
  const content = typeof message.content === 'string' ? message.content : '';
  const reasoningContent =
    typeof message.reasoning_content === 'string' ? message.reasoning_content : undefined;

  return {
    content,
    reasoningContent,
    toolCalls: parseToolCalls(message),
    totalTokens: json.usage?.total_tokens ?? 0,
  };
}
