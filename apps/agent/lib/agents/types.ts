import { z } from 'zod';

import { ALL_TOOL_IDS } from '@/lib/tools';

export const AgentStatusSchema = z.enum(['active', 'paused']);
export type AgentStatus = z.infer<typeof AgentStatusSchema>;

export const AgentPersonaSchema = z.object({
  systemPrompt: z.string().default(''),
  style: z.string().optional(),
  constraints: z.array(z.string()).optional(),
});

export const AgentToolsConfigSchema = z.object({
  enabledToolIds: z.array(z.string()).default([]),
  workflowToolAllowlist: z.array(z.string()).optional(),
});

export const AgentTrainingSchema = z.object({
  examples: z
    .array(
      z.object({
        user: z.string(),
        assistant: z.string(),
      }),
    )
    .default([]),
});

export const WorkspaceAgentSchema = z.object({
  id: z
    .string()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9][a-z0-9_-]*$/i, 'id must be a slug (letters, numbers, _ -)'),
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  status: AgentStatusSchema.default('active'),
  defaultModelId: z.string().max(120).optional(),
  workflowId: z.string().max(64).optional(),
  persona: AgentPersonaSchema.default({ systemPrompt: '' }),
  tools: AgentToolsConfigSchema.default({ enabledToolIds: [] }),
  training: AgentTrainingSchema.default({ examples: [] }),
  updatedAt: z.string(),
});

export type WorkspaceAgent = z.infer<typeof WorkspaceAgentSchema>;

export const CreateAgentBodySchema = z.object({
  id: WorkspaceAgentSchema.shape.id,
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
});

export const UpdateAgentBodySchema = z
  .object({
    name: z.string().min(1).max(200).optional(),
    description: z.string().max(2000).optional(),
    status: AgentStatusSchema.optional(),
    defaultModelId: z.string().max(120).optional(),
    workflowId: z.string().max(64).optional(),
    persona: AgentPersonaSchema.partial().optional(),
    tools: AgentToolsConfigSchema.partial().optional(),
    training: AgentTrainingSchema.partial().optional(),
  })
  .strict();

const VALID_TOOL_SET = new Set<string>(ALL_TOOL_IDS);

export function sanitizeEnabledToolIds(ids: string[]): string[] {
  return [...new Set(ids.filter((id) => VALID_TOOL_SET.has(id)))];
}

export function defaultWorkspaceAgent(id: string, name?: string): WorkspaceAgent {
  const now = new Date().toISOString();
  return WorkspaceAgentSchema.parse({
    id,
    name: name ?? id,
    status: 'active',
    persona: { systemPrompt: '' },
    tools: { enabledToolIds: [] },
    training: { examples: [] },
    updatedAt: now,
  });
}