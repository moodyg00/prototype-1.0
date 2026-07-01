import type { StructuredToolInterface } from '@langchain/core/tools';

import { XAI_BASE_URL } from './xai';

export type XaiChatMessage =
  | { role: 'system' | 'user'; content: string }
  | {
      role: 'assistant';
      content: string;
      tool_calls?: Array<{
        id: string;
        type: 'function';
        function: { name: string; arguments: string };
      }>;
    }
  | {
      role: 'tool';
      content: string;
      tool_call_id: string;
    };

export type XaiToolDefinition = {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
};

export type XaiToolCall = {
  id: string;
  name: string;
  args: Record<string, unknown>;
};

export type XaiChatResult = {
  content: string;
  reasoningContent?: string;
  toolCalls: XaiToolCall[];
  totalTokens: number;
  rawMessage?: Record<string, unknown>;
};

type ReasoningEffort = 'low' | 'medium' | 'high';

function parseToolCalls(message: Record<string, unknown>): XaiToolCall[] {
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

/**
 * Direct xAI chat/completions call that preserves reasoning_content and tool_calls.
 * LangChain often drops reasoning_content; this thin client keeps the full message.
 */
export async function invokeXaiChat(opts: {
  apiKey: string;
  model: string;
  messages: XaiChatMessage[];
  tools?: XaiToolDefinition[];
  reasoningEffort?: ReasoningEffort;
  signal?: AbortSignal;
}): Promise<XaiChatResult> {
  const body: Record<string, unknown> = {
    model: opts.model,
    messages: opts.messages,
    reasoning_effort: opts.reasoningEffort ?? 'low',
  };
  if (opts.tools?.length) {
    body.tools = opts.tools;
    body.tool_choice = 'auto';
  }

  const res = await fetch(`${XAI_BASE_URL}/chat/completions`, {
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
    throw new Error(`xAI error ${res.status}: ${txt}`);
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
    rawMessage: message,
  };
}

/** Best-effort OpenAI parameters from a LangChain tool's Zod schema. */
export function toolSchemaToOpenAiParameters(tool: StructuredToolInterface): Record<string, unknown> {
  const t = tool as unknown as { schema?: { shape?: Record<string, unknown> } };
  const shape = t.schema?.shape;
  if (!shape || typeof shape !== 'object') {
    return { type: 'object', properties: {}, additionalProperties: false };
  }

  const properties: Record<string, unknown> = {};
  const required: string[] = [];

  for (const [key, field] of Object.entries(shape)) {
    const f = field as {
      _def?: { typeName?: string; innerType?: { _def?: { typeName?: string } }; defaultValue?: () => unknown };
      description?: string;
    };
    const def = f._def;
    let typeName = def?.typeName ?? 'ZodString';
    let optional = false;
    if (typeName === 'ZodDefault' || typeName === 'ZodOptional') {
      optional = typeName === 'ZodOptional';
      typeName = def?.innerType?._def?.typeName ?? 'ZodString';
    }
    let jsonType = 'string';
    if (typeName === 'ZodBoolean') jsonType = 'boolean';
    else if (typeName === 'ZodNumber') jsonType = 'number';
    else if (typeName === 'ZodEnum') jsonType = 'string';

    const prop: Record<string, unknown> = { type: jsonType };
    if (f.description) prop.description = f.description;
    properties[key] = prop;
    if (!optional && typeName !== 'ZodDefault') required.push(key);
  }

  return {
    type: 'object',
    properties,
    required: required.length ? required : undefined,
    additionalProperties: false,
  };
}

export function langChainToolsToXai(tools: StructuredToolInterface[]): XaiToolDefinition[] {
  return tools.map((tool) => ({
    type: 'function' as const,
    function: {
      name: tool.name,
      description: tool.description,
      parameters: toolSchemaToOpenAiParameters(tool),
    },
  }));
}
