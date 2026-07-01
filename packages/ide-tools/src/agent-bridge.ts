/**
 * Shared request/response contract for the public-dev <-> agent IDE chat bridge.
 *
 * public-dev's `/api/projects/[slug]/agent` route forwards to the agent app's
 * `/api/ide-agent/run` route over HTTP (AGENT_BASE_URL, see agentBridgeUrl below).
 * Both sides previously hand-rolled structurally-similar-but-untyped request/
 * response shapes; importing from here means a field rename on one side is a
 * compile error on the other instead of a silent runtime mismatch.
 */
import { z } from 'zod';
import type { AgentTodoItem } from './agent-todos';
import type { ThoughtStep, ToolEvent } from './types';

export const ElementContextSchema = z.object({
  cssSelector: z.string(),
  xpath: z.string(),
  tagName: z.string(),
  id: z.string(),
  classList: z.array(z.string()),
  attributes: z.record(z.string(), z.string()),
  outerHTML: z.string(),
  innerText: z.string(),
  computedStyles: z.record(z.string(), z.string()),
  rect: z.object({ x: z.number(), y: z.number(), w: z.number(), h: z.number() }),
});

export const DesignContextSchema = z.object({
  pagePath: z.string(),
  selections: z.array(ElementContextSchema),
  annotation: z
    .object({
      kind: z.literal('area'),
      rect: z.object({ x: z.number(), y: z.number(), w: z.number(), h: z.number() }),
    })
    .optional(),
  viewport: z.object({ w: z.number(), h: z.number() }).optional(),
  screenshotDataUrl: z.string().startsWith('data:image/').max(8_000_000).optional(),
});

export const AgentTodoSchema = z.object({
  id: z.string(),
  content: z.string(),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']),
});

/** Body public-dev sends to its own `/api/projects/[slug]/agent` route (no `slug` — it's a path param). */
export const IdeAgentChatRequestSchema = z.object({
  messages: z
    .array(z.object({ role: z.enum(['user', 'assistant', 'system']), content: z.string() }))
    .min(1),
  designContext: DesignContextSchema.optional(),
  threadId: z.string().optional(),
  runId: z.string().optional(),
  modelId: z.string().optional(),
  todos: z.array(AgentTodoSchema).optional(),
});
export type IdeAgentChatRequest = z.infer<typeof IdeAgentChatRequestSchema>;

/** Body public-dev's route forwards to the agent app's `/api/ide-agent/run` (adds `slug`). */
export const IdeAgentRunRequestSchema = IdeAgentChatRequestSchema.extend({
  slug: z.string().min(1),
});
export type IdeAgentRunRequest = z.infer<typeof IdeAgentRunRequestSchema>;

/** Response shape returned by both the agent app's run route and public-dev's proxy route. */
export type IdeAgentChatResponse = {
  text: string;
  tools: ToolEvent[];
  thoughts?: ThoughtStep[];
  filesChanged: boolean;
  requestDeploy: boolean;
  deployReason?: string;
  runId?: string | null;
  threadId?: string;
  agentRunId?: string;
  todos?: AgentTodoItem[];
  tokens?: number;
  modelId?: string;
  error?: string;
};

/** Resolves the agent app's base URL for the public-dev -> agent HTTP bridge. Dev-mode default only. */
export function agentBridgeUrl(): string {
  return process.env.AGENT_BASE_URL?.trim() || 'http://localhost:3002';
}
