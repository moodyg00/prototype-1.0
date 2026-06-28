import { NextResponse } from 'next/server';
import { z } from 'zod';
import { generateText, stepCountIs } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { projectExists } from '@/src/lib/projects';
import { AGENT_SYSTEM_PROMPT, buildProjectTools, type AgentToolState } from '@/src/lib/agent/tools';

export const runtime = 'nodejs';
export const maxDuration = 60;

type Ctx = { params: Promise<{ slug: string }> };

const BodySchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant', 'system']),
        content: z.string(),
      }),
    )
    .min(1),
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

  try {
    const result = await generateText({
      model: openai(model),
      system: AGENT_SYSTEM_PROMPT(slug),
      messages: parsed.data.messages,
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
