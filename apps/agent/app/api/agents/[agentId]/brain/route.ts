import { NextResponse } from 'next/server';

import { deleteAgentMemoryEvent, getAgentBrainSnapshot } from '@/lib/agents/brain-service';

export const runtime = 'nodejs';

type RouteCtx = { params: Promise<{ agentId: string }> };

export async function GET(_request: Request, ctx: RouteCtx) {
  const { agentId } = await ctx.params;
  try {
    const brain = await getAgentBrainSnapshot(agentId);
    return NextResponse.json(brain);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load brain snapshot';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request, ctx: RouteCtx) {
  const { agentId } = await ctx.params;
  try {
    const url = new URL(request.url);
    const eventId = url.searchParams.get('eventId');
    if (!eventId) {
      return NextResponse.json({ error: 'eventId query param required' }, { status: 400 });
    }
    const ok = await deleteAgentMemoryEvent(eventId);
    if (!ok) {
      return NextResponse.json({ error: 'Event not found or delete failed' }, { status: 404 });
    }
    const brain = await getAgentBrainSnapshot(agentId);
    return NextResponse.json({ ok: true, brain });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Delete failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}