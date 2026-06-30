import { NextResponse } from 'next/server';
import { recallMemory } from '@prototype/memory';

import { getMemoryBinding } from '@/lib/memory/bindings';

export async function POST(req: Request) {
  const body = (await req.json()) as {
    query?: string;
    agentId?: string;
    topK?: number;
    scopeKind?: string;
    scopeId?: string;
  };

  const query = body.query?.trim();
  if (!query) {
    return NextResponse.json({ error: 'query is required' }, { status: 400 });
  }

  const agentId = body.agentId ?? 'default';
  const binding = await getMemoryBinding(agentId);
  const hits = await recallMemory({
    agentId,
    query,
    topK: body.topK ?? 8,
    binding,
  });

  return NextResponse.json({ hits, count: hits.length });
}