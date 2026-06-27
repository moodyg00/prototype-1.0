import { z } from 'zod';

import { agentMemoryService } from '../memory/service';
import type { AgentTool } from './types';

const searchSchema = z.object({
  query: z.string().min(1),
  limit: z.number().int().min(1).max(50).optional(),
});

const recallSchema = z.object({
  limit: z.number().int().min(1).max(100).optional(),
});

const logSchema = z.object({
  content: z.string().min(1),
  type: z.enum(['scene', 'persona', 'turn', 'tool']).optional(),
  level: z.number().int().min(1).max(3).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const memorySearchTool: AgentTool = {
  name: 'memory_search',
  description: 'Search persisted agent memory by content.',
  inputSchema: searchSchema,
  execute: async (ctx, input) => {
    const parsed = searchSchema.parse(input);
    const events = await agentMemoryService.search(ctx.agentId, parsed.query, parsed.limit ?? 20);
    return { count: events.length, events };
  },
};

export const memoryRecallTool: AgentTool = {
  name: 'memory_recall',
  description: 'Recall recent persisted memory events for this agent.',
  inputSchema: recallSchema,
  execute: async (ctx, input) => {
    const parsed = recallSchema.parse(input);
    const events = await agentMemoryService.recallRecent(ctx.agentId, parsed.limit ?? 30);
    return { count: events.length, events };
  },
};

export const memoryLogTool: AgentTool = {
  name: 'memory_log',
  description: 'Write a strategic memory event for this agent.',
  inputSchema: logSchema,
  execute: async (ctx, input) => {
    const parsed = logSchema.parse(input);
    const event = await agentMemoryService.logEvent({
      agentId: ctx.agentId,
      type: parsed.type ?? 'scene',
      level: parsed.level ?? 2,
      content: parsed.content,
      metadata: parsed.metadata,
    });
    return { event };
  },
};

export const memoryTools = [memorySearchTool, memoryRecallTool, memoryLogTool];