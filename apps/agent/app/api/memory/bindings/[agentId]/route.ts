import { NextResponse } from 'next/server';

import { getMemoryBinding, saveMemoryBinding } from '@/lib/memory/bindings';
import type { MemoryScope } from '@prototype/memory';

type Params = { params: Promise<{ agentId: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { agentId } = await params;
  const binding = await getMemoryBinding(agentId);
  return NextResponse.json(binding);
}

export async function PUT(req: Request, { params }: Params) {
  const { agentId } = await params;
  const body = (await req.json()) as {
    readScopes?: MemoryScope[];
    writeScopes?: MemoryScope[];
    defaultPartition?: string;
  };

  const current = await getMemoryBinding(agentId);
  const updated = await saveMemoryBinding({
    agentId,
    readScopes: body.readScopes ?? current.readScopes,
    writeScopes: body.writeScopes ?? current.writeScopes,
    defaultPartition: body.defaultPartition ?? current.defaultPartition,
  });

  return NextResponse.json(updated);
}