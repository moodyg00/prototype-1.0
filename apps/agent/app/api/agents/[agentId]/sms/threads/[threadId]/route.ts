import { NextResponse } from 'next/server';
import type { AgentSmsMessage } from '@prototype/db';

import { getSmsMessages } from '@/lib/agents/phone-service';

export const runtime = 'nodejs';

type RouteCtx = { params: Promise<{ agentId: string; threadId: string }> };

export async function GET(_req: Request, ctx: RouteCtx) {
  const { threadId } = await ctx.params;
  try {
    const messages = await getSmsMessages(threadId);
    return NextResponse.json({
      messages: messages.map((m: AgentSmsMessage) => ({
        id: m.id,
        threadId: m.threadId,
        direction: m.direction,
        body: m.body,
        twilioSid: m.twilioSid ?? null,
        status: m.status,
        createdAt: m.createdAt?.toISOString() ?? '',
      })),
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to load messages' },
      { status: 500 },
    );
  }
}
