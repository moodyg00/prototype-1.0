import { NextResponse } from 'next/server';
import { z } from 'zod';
import { generateText, stepCountIs, type ModelMessage } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { projectExists } from '@/src/lib/projects';
import { AGENT_SYSTEM_PROMPT, buildProjectTools, type AgentToolState } from '@/src/lib/agent/tools';
import { buildDesignPromptBlock } from '@/src/lib/design-mode';

export const runtime = 'nodejs';
export const maxDuration = 60;

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
  screenshotDataUrl: z
    .string()
    .startsWith('data:image/')
    .max(8_000_000)
    .optional(),
});

const BodySchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant', 'system']),
        content: z.string(),
      }),
    )
    .min(1),
  designContext: DesignContextSchema.optional(),
});

export async function POST(req: Request, { params }: Ctx) {
  const { slug } = await params;
  if (!(await projectExists(slug))) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json({
      text:
        'No OPENAI_API_KEY is configured, so the agent is offline. Set OPENAI_API_KEY in apps/public-dev/.env.local to enable it. You can still edit files directly in the editor.',
      tools: [],
      filesChanged: false,
      requestDeploy: false,
    });
  }

  const state: AgentToolState = { filesChanged: false, requestDeploy: false, events: [] };
  const tools = buildProjectTools(slug, state);
  const openai = createOpenAI({ apiKey });
  const model = process.env.OPENAI_MODEL?.trim() || 'gpt-4o-mini';

  const messages: ModelMessage[] = parsed.data.messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));
  const design = parsed.data.designContext;
  if (design && design.selections.length > 0) {
    messages.push({
      role: 'system',
      content:
        'The user is using Design Mode and selected elements in the live preview. ' +
        'Apply their request to the corresponding source by editing the page listed below and any CSS/JS it references. ' +
        'Prefer minimal, targeted edits and read the file before writing.\n\n' +
        buildDesignPromptBlock(design),
    });
    if (design.screenshotDataUrl) {
      messages.push({
        role: 'user',
        content: [
          { type: 'text', text: 'Screenshot of the current selection (red marks = my annotations):' },
          { type: 'image', image: design.screenshotDataUrl },
        ],
      });
    }
  }

  try {
    const result = await generateText({
      model: openai(model),
      system: AGENT_SYSTEM_PROMPT(slug),
      messages,
      tools,
      stopWhen: stepCountIs(12),
    });

    return NextResponse.json({
      text: result.text || '(done)',
      tools: state.events,
      filesChanged: state.filesChanged,
      requestDeploy: state.requestDeploy,
      deployReason: state.deployReason,
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
