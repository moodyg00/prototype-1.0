import { NextResponse } from 'next/server';
import { z } from 'zod';
import { projectExists } from '@/src/lib/projects';

export const runtime = 'nodejs';
export const maxDuration = 120;

type Ctx = { params: Promise<{ slug: string }> };

const ElementContextSchema = z.object({
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

const DesignContextSchema = z.object({
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

const BodySchema = z.object({
  messages: z
    .array(z.object({ role: z.enum(['user', 'assistant', 'system']), content: z.string() }))
    .min(1),
  designContext: DesignContextSchema.optional(),
  threadId: z.string().optional(),
  runId: z.string().optional(),
});

/** Base URL of the agent app that hosts the IDE Agent workflow. */
function agentBaseUrl(): string {
  return process.env.AGENT_BASE_URL?.trim() || 'http://localhost:3002';
}

/**
 * IDE chat endpoint. Delegates to the LangGraph "IDE Agent Visual" workflow
 * hosted in the agent app, which runs a Grok ReAct agent bound to the same
 * path-scoped file tools the IDE uses. The response shape is unchanged so the
 * AgentChat UI works without modification.
 */
export async function POST(req: Request, { params }: Ctx) {
  const { slug } = await params;
  if (!(await projectExists(slug))) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  try {
    const res = await fetch(`${agentBaseUrl()}/api/ide-agent/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug,
        messages: parsed.data.messages,
        designContext: parsed.data.designContext,
        threadId: parsed.data.threadId,
        runId: parsed.data.runId,
      }),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      const message = (json && (json.error || json.message)) || `Agent error (${res.status}).`;
      return NextResponse.json({ error: message }, { status: 502 });
    }
    return NextResponse.json(json);
  } catch {
    return NextResponse.json({
      text:
        `Could not reach the agent service at ${agentBaseUrl()}. Make sure the agent app is running ` +
        `(pnpm --filter @prototype/agent dev) and AGENT_BASE_URL is set. You can still edit files directly in the editor.`,
      tools: [],
      filesChanged: false,
      requestDeploy: false,
    });
  }
}
