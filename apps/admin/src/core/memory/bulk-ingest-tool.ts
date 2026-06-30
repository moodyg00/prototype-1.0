import { tool } from 'ai';
import { z } from 'zod';

import { bulkIngestViaAgent } from './vector-service';

export const memoryBulkIngestTool = tool({
  description:
    'Bulk ingest text into shared vector memory via the Agent app Memory Ingest workflow (Chroma + catalog).',
  inputSchema: z.object({
    text: z.string().min(1),
    scopeKind: z.enum(['global', 'agent', 'group']).default('global'),
    scopeId: z.string().optional(),
    agentId: z.string().optional(),
    sourceKind: z.string().default('seed'),
  }),
  execute: async (input) => bulkIngestViaAgent(input),
});