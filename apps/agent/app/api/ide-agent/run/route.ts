import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { projectExists } from '@prototype/ide-tools';
import { prisma } from '../../../../lib/prisma';

export const runtime = 'nodejs';
export const maxDuration = 120;

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
  slug: z.string().min(1),
  messages: z
    .array(z.object({ role: z.enum(['user', 'assistant', 'system']), content: z.string() }))
    .min(1),
  designContext: DesignContextSchema.optional(),
  threadId: z.string().optional(),
  runId: z.string().optional(),
  modelId: z.string().optional(),
});

type ToolEvent = { tool: string; summary: string };
type ThoughtStep = { step: number; reasoning?: string; tool?: string; summary?: string };

function selfBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    `http://localhost:${process.env.PORT?.trim() || '3002'}`
  );
}

async function resolveWorkflowId(): Promise<string | null> {
  const fromEnv = process.env.IDE_AGENT_WORKFLOW_ID?.trim();
  if (fromEnv) return fromEnv;
  try {
    if (!prisma) return null;
    const wf = await prisma.workflow.findFirst({
      where: { name: 'IDE Agent Visual' },
      orderBy: { updatedAt: 'desc' },
      select: { id: true },
    });
    return wf?.id ?? null;
  } catch {
    return null;
  }
}

function thoughtsToIngestText(slug: string, thoughts: ThoughtStep[]): string {
  if (!thoughts.length) return '';
  return [
    `# IDE agent thought trace (${slug})`,
    '',
    ...thoughts.map((t) => {
      const parts = [`Step ${t.step}`];
      if (t.reasoning) parts.push(`Reasoning: ${t.reasoning}`);
      if (t.tool) parts.push(`Tool: ${t.tool}`);
      if (t.summary) parts.push(`Result: ${t.summary}`);
      return parts.join('\n');
    }),
  ].join('\n\n');
}

async function maybeIngestThoughts(args: {
  runId: string | null;
  slug: string;
  thoughts: ThoughtStep[];
}): Promise<void> {
  if (!args.runId || !args.thoughts.length) return;
  if (process.env.IDE_AGENT_INGEST_THOUGHTS === 'false') return;
  const text = thoughtsToIngestText(args.slug, args.thoughts);
  if (!text.trim()) return;
  try {
    await fetch(`${selfBaseUrl()}/api/memory/ingest-from-run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        runId: args.runId,
        agentId: `ide-${args.slug}`,
        scopeKind: 'agent',
        scopeId: `ide-${args.slug}`,
      }),
    });
  } catch (err) {
    console.warn('[ide-agent] thought ingest failed:', (err as Error).message);
  }
}

/**
 * Adapter endpoint for the public-dev IDE chat. Translates the chat request into
 * a run of the "IDE Agent Visual" LangGraph workflow and maps the resulting graph
 * state back into the shape AgentChat expects.
 */
export async function POST(req: Request) {
  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }
  const { slug, messages, designContext, threadId, modelId } = parsed.data;
  const runId = parsed.data.runId ?? randomUUID();

  if (!(await projectExists(slug))) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  const workflowId = await resolveWorkflowId();
  if (!workflowId) {
    return NextResponse.json({
      text:
        'The IDE agent workflow is not seeded yet. Run scripts/seed-ide-agent-workflow.ts (or set IDE_AGENT_WORKFLOW_ID). You can still edit files directly in the editor.',
      tools: [],
      thoughts: [],
      filesChanged: false,
      requestDeploy: false,
    });
  }

  const input = JSON.stringify({ slug, messages, designContext, runId, threadId, modelId });

  let runJson: any;
  try {
    const res = await fetch(`${selfBaseUrl()}/api/workflow/${workflowId}/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input, threadId }),
    });
    runJson = await res.json().catch(() => null);
    if (!res.ok) {
      const message =
        (runJson && (runJson.error || runJson.message)) || `Workflow run failed (${res.status}).`;
      return NextResponse.json({ error: message }, { status: 502 });
    }
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 502 });
  }

  const state = runJson?.state ?? {};
  const ide = state.ide ?? {};
  const events: ToolEvent[] = Array.isArray(ide.events) ? ide.events : [];
  const thoughts: ThoughtStep[] = Array.isArray(ide.thoughts) ? ide.thoughts : [];
  const workflowRunId = typeof runJson?.runId === 'string' ? runJson.runId : null;

  void maybeIngestThoughts({ runId: workflowRunId, slug, thoughts });

  return NextResponse.json({
    text: (typeof state.output === 'string' && state.output) || '(done)',
    tools: events,
    thoughts,
    filesChanged: Boolean(ide.filesChanged),
    requestDeploy: Boolean(ide.requestDeploy),
    deployReason: ide.deployReason,
    runId: workflowRunId,
    threadId: runJson?.threadId ?? threadId,
    agentRunId: runId,
  });
}
