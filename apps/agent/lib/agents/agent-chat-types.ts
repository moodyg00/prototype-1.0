import { z } from 'zod';

export const AgentChatMessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string(),
});

export const AgentChatRequestSchema = z.object({
  messages: z.array(AgentChatMessageSchema).min(1),
  threadId: z.string().optional(),
  modelId: z.string().optional(),
  useMemory: z.boolean().optional(),
  ingestChat: z.boolean().optional(),
});

export type AgentChatMessage = z.infer<typeof AgentChatMessageSchema>;
export type AgentChatRequest = z.infer<typeof AgentChatRequestSchema>;

/** Payload for standard workflow runs (`Agent Chat Visual`). */
export type AgentChatWorkflowInput = {
  kind: 'agent_chat';
  messages: AgentChatMessage[];
  systemPrompt: string;
  modelId?: string;
  memoryContext?: string;
};

export function serializeAgentChatWorkflowInput(payload: AgentChatWorkflowInput): string {
  return JSON.stringify(payload);
}