import { NextResponse } from 'next/server';
import type { AgentSmsThread } from '@prototype/db';

import { listSmsThreads } from '@/lib/agents/phone-service';

export const runtime = 'nodejs';

type RouteCtx = { params: Promise<{ agentId: string }> };

export async function GET(_req: Request, ctx: RouteCtx) {
  const { agentId } = await ctx.params;
  try {
    const threads = await listSmsThreads(agentId);
    return NextResponse.json({
      threads: threads.map((t: AgentSmsThread) => ({
        id: t.id,
        agentId: t.agentId,
        contactPhone: t.contactPhone,
        agentPhone: t.agentPhone,
        status: t.status,
        lastMessageAt: t.lastMessageAt?.toISOString() ?? null,
        createdAt: t.createdAt?.toISOString() ?? '',
      })),
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to list threads' },
      { status: 500 },
    );
  }
}
