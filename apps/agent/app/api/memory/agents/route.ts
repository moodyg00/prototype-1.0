import { NextResponse } from 'next/server';

import { listKnownAgentIds } from '@/lib/memory/bindings';
import { isMissingMemoryCatalogError, memoryCatalogHint } from '@/lib/memory/prisma-errors';

export async function GET() {
  try {
    const agentIds = await listKnownAgentIds();
    return NextResponse.json({ agentIds });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to list agents';
    return NextResponse.json({
      agentIds: ['default'],
      error: message,
      hint: isMissingMemoryCatalogError(error) ? memoryCatalogHint() : undefined,
    });
  }
}