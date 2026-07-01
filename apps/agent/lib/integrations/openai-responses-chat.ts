import type { ChatMessage, ChatResult, ToolCall, ToolDefinition } from './chat-types';

type ResponsesTool = {
  type: 'function';
  name: string;
  description: string;
  parameters: Record<string, unknown>;
};

function toResponsesTools(tools: ToolDefinition[]): ResponsesTool[] {
  return tools.map((tool) => ({
    type: 'function',
    name: tool.function.name,
    description: tool.function.description,
    parameters: tool.function.parameters,
  }));
}

/** Codex and other OpenAI models that only accept /v1/responses. */
export function isOpenAiResponsesModel(modelId: string): boolean {
  return /codex/i.test(modelId);
}

function toResponsesInput(messages: ChatMessage[]): unknown[] {
  const input: unknown[] = [];
  for (const m of messages) {
    if (m.role === 'user') {
      input.push({ role: 'user', content: m.content });
      continue;
    }
    if (m.role === 'assistant') {
      if (m.content.trim()) {
        input.push({ role: 'assistant', content: m.content });
      }
      for (const tc of m.toolCalls ?? []) {
        input.push({
          type: 'function_call',
          call_id: tc.id,
          name: tc.name,
          arguments: JSON.stringify(tc.args ?? {}),
        });
      }
      continue;
    }
    if (m.role === 'tool') {
      input.push({
        type: 'function_call_output',
        call_id: m.toolCallId,
        output: m.content,
      });
    }
  }
  return input;
}

function textFromMessageContent(content: unknown): string {
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return '';
  return content
    .map((part) => {
      const p = part as { type?: string; text?: string };
      if (p.type === 'output_text' && p.text) return p.text;
      if (typeof p === 'string') return p;
      return '';
    })
    .join('');
}

function parseResponsesOutput(output: unknown[]): {
  content: string;
  reasoningContent?: string;
  toolCalls: ToolCall[];
} {
  let content = '';
  let reasoningContent = '';
  const toolCalls: ToolCall[] = [];

  for (const item of output) {
    const it = item as {
      type?: string;
      role?: string;
      content?: unknown;
      summary?: Array<{ type?: string; text?: string }>;
      call_id?: string;
      name?: string;
      arguments?: string;
    };

    if (it.type === 'message') {
      content += textFromMessageContent(it.content);
    } else if (it.type === 'reasoning') {
      const summary = Array.isArray(it.summary)
        ? it.summary.map((s) => s.text ?? '').filter(Boolean).join('\n')
        : '';
      if (summary) reasoningContent += (reasoningContent ? '\n' : '') + summary;
    } else if (it.type === 'function_call' && it.name) {
      let args: Record<string, unknown> = {};
      try {
        args = it.arguments ? (JSON.parse(it.arguments) as Record<string, unknown>) : {};
      } catch {
        args = {};
      }
      toolCalls.push({
        id: it.call_id ?? '',
        name: it.name,
        args,
      });
    }
  }

  return { content, reasoningContent: reasoningContent || undefined, toolCalls };
}

/** OpenAI Responses API (required for Codex models). */
export async function invokeOpenAiResponsesChat(opts: {
  apiKey: string;
  baseUrl: string;
  model: string;
  systemPrompt: string;
  messages: ChatMessage[];
  tools?: ToolDefinition[];
  signal?: AbortSignal;
}): Promise<ChatResult> {
  const body: Record<string, unknown> = {
    model: opts.model,
    instructions: opts.systemPrompt,
    input: toResponsesInput(opts.messages),
    store: false,
  };
  if (opts.tools?.length) {
    body.tools = toResponsesTools(opts.tools);
    body.tool_choice = 'auto';
  }

  const res = await fetch(`${opts.baseUrl.replace(/\/$/, '')}/responses`, {
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
    throw new Error(`Responses API error ${res.status}: ${txt.slice(0, 500)}`);
  }

  const json = (await res.json()) as {
    output?: unknown[];
    output_text?: string;
    usage?: { total_tokens?: number; input_tokens?: number; output_tokens?: number };
  };

  const output = Array.isArray(json.output) ? json.output : [];
  const parsed = parseResponsesOutput(output);
  const content = parsed.content || json.output_text || '';
  const tokens =
    json.usage?.total_tokens ??
    (json.usage?.input_tokens ?? 0) + (json.usage?.output_tokens ?? 0);

  return {
    content,
    reasoningContent: parsed.reasoningContent,
    toolCalls: parsed.toolCalls,
    totalTokens: tokens,
  };
}
