import { NextResponse } from 'next/server';
import { projectExists } from '@/src/lib/projects';
import {
  IdeAgentChatRequestSchema,
  agentBridgeUrl,
  type IdeAgentChatResponse,
} from '@prototype/ide-tools/agent-bridge';

export const runtime = 'nodejs';
export const maxDuration = 120;

type Ctx = { params: Promise<{ slug: string }> };

const BodySchema = IdeAgentChatRequestSchema;

/** Base URL of the agent app that hosts the IDE Agent workflow. */
const agentBaseUrl = agentBridgeUrl;

/**
 * IDE chat endpoint. Delegates to the LangGraph "IDE Agent Visual" workflow
 * hosted in the agent app, which runs a ReAct agent bound to the same
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
        modelId: parsed.data.modelId,
        todos: parsed.data.todos,
      }),
    });
    const json = (await res.json().catch(() => null)) as (IdeAgentChatResponse & { message?: string }) | null;
    if (!res.ok) {
      const message = (json && (json.error || json.message)) || `Agent error (${res.status}).`;
      return NextResponse.json({ error: message }, { status: 502 });
    }
    return NextResponse.json(json satisfies IdeAgentChatResponse | null);
  } catch {
    const fallback: IdeAgentChatResponse = {
      text:
        `Could not reach the agent service at ${agentBaseUrl()}. Make sure the agent app is running ` +
        `(pnpm --filter @prototype/agent dev) and AGENT_BASE_URL is set. You can still edit files directly in the editor.`,
      tools: [],
      filesChanged: false,
      requestDeploy: false,
    };
    return NextResponse.json(fallback);
  }
}
