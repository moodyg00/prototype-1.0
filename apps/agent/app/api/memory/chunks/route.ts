import { NextResponse } from 'next/server';

import { listMemoryChunks } from '@/lib/memory/catalog';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const scopeKind = url.searchParams.get('scopeKind') || undefined;
  const scopeId = url.searchParams.get('scopeId') || undefined;
  const partition = url.searchParams.get('partition') || undefined;
  const limit = Number(url.searchParams.get('limit') ?? 50) || 50;

  try {
    const chunks = await listMemoryChunks({ scopeKind, scopeId, partition, limit });
    return NextResponse.json({ chunks, count: chunks.length });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to list chunks';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}