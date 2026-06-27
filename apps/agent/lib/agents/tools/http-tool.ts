import { z } from 'zod';

import type { AgentTool } from './types';

const httpRequestSchema = z.object({
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']).default('GET'),
  url: z.string().url(),
  headers: z.record(z.string(), z.string()).optional(),
  body: z.unknown().optional(),
});

export const httpRequestTool: AgentTool = {
  name: 'http_request',
  description: 'Perform an HTTP request and return status + parsed body.',
  inputSchema: httpRequestSchema,
  execute: async (_ctx, input) => {
    const parsed = httpRequestSchema.parse(input);
    const response = await fetch(parsed.url, {
      method: parsed.method,
      headers: parsed.headers,
      body: parsed.body != null ? JSON.stringify(parsed.body) : undefined,
    });

    const text = await response.text();
    let body: unknown = text;
    try {
      body = JSON.parse(text);
    } catch {
      // keep text body
    }

    return {
      ok: response.ok,
      status: response.status,
      body,
    };
  },
};