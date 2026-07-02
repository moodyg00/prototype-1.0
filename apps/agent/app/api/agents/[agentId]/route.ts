import { NextResponse } from 'next/server';

import {
  deleteWorkspaceAgent,
  getWorkspaceAgent,
  updateWorkspaceAgent,
} from '@/lib/agents/registry-store';
import { UpdateAgentBodySchema } from '@/lib/agents/types';

export const runtime = 'nodejs';

type RouteCtx = { params: Promise<{ agentId: string }> };

export async function GET(_request: Request, ctx: RouteCtx) {
  const { agentId } = await ctx.params;
  try {
    const agent = await getWorkspaceAgent(agentId);
    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }
    return NextResponse.json({ agent });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load agent';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request, ctx: RouteCtx) {
  const { agentId } = await ctx.params;
  try {
    const body = await request.json();
    const parsed = UpdateAgentBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }
    const agent = await updateWorkspaceAgent(agentId, parsed.data);
    return NextResponse.json({ agent });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update agent';
    const status = message.includes('not found') ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(_request: Request, ctx: RouteCtx) {
  const { agentId } = await ctx.params;
  try {
    await deleteWorkspaceAgent(agentId);
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete agent';
    const status = message.includes('not found') ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}