import { NextResponse } from 'next/server';

import { listKnownAgentIds } from '@/lib/memory/bindings';
import {
  createWorkspaceAgent,
  listWorkspaceAgents,
  seedWorkspaceAgentsFromIds,
} from '@/lib/agents/registry-store';
import { CreateAgentBodySchema } from '@/lib/agents/types';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const seed = url.searchParams.get('seed') === '1';

  try {
    if (seed) {
      let ids: string[] = [];
      try {
        ids = await listKnownAgentIds();
      } catch {
        ids = ['default'];
      }
      const agents = await seedWorkspaceAgentsFromIds(ids);
      return NextResponse.json({ agents });
    }
    const agents = await listWorkspaceAgents();
    return NextResponse.json({ agents });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to list agents';
    return NextResponse.json({ error: message, agents: [] }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = CreateAgentBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }
    const agent = await createWorkspaceAgent(parsed.data);
    return NextResponse.json({ agent }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create agent';
    const status = message.includes('already exists') ? 409 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}