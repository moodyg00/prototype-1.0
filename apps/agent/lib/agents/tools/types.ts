import type { z } from 'zod';

export type ToolContext = {
  agentId: string;
  runId?: string;
};

export type AgentTool = {
  name: string;
  description: string;
  inputSchema: z.ZodTypeAny;
  execute: (ctx: ToolContext, input: unknown) => Promise<unknown>;
};

export type ToolRegistrySnapshot = Array<{
  name: string;
  description: string;
}>;