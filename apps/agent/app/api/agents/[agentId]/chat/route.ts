import { NextResponse } from 'next/server';

import { runAgentChat } from '@/lib/agents/agent-chat';
import { AgentChatRequestSchema } from '@/lib/agents/agent-chat-types';

export const runtime = 'nodejs';
export const maxDuration = 120;

type RouteCtx = { params: Promise<{ agentId: string }> };

export async function POST(request: Request, ctx: RouteCtx) {
  const { agentId } = await ctx.params;
  try {
    const body = await request.json();
    const parsed = AgentChatRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }
    const response = await runAgentChat({
      agentId,
      messages: parsed.data.messages,
      threadId: parsed.data.threadId,
      modelId: parsed.data.modelId,
      useMemory: parsed.data.useMemory,
      ingestChat: parsed.data.ingestChat,
    });
    if (response.error && !response.text) {
      return NextResponse.json(response, { status: 502 });
    }
    return NextResponse.json(response);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Chat failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}