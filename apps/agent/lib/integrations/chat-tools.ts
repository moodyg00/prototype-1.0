import type { StructuredToolInterface } from '@langchain/core/tools';

import type { ToolDefinition } from './chat-types';

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

export function langChainToolsToOpenAi(tools: StructuredToolInterface[]): ToolDefinition[] {
  return tools.map((tool) => ({
    type: 'function' as const,
    function: {
      name: tool.name,
      description: tool.description,
      parameters: toolSchemaToOpenAiParameters(tool),
    },
  }));
}

export function langChainToolsToAnthropic(tools: StructuredToolInterface[]) {
  return tools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    input_schema: toolSchemaToOpenAiParameters(tool),
  }));
}
