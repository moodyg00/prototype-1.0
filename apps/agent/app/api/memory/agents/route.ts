import { NextResponse } from 'next/server';

import { listKnownAgentIds } from '@/lib/memory/bindings';

export async function GET() {
  const agentIds = await listKnownAgentIds();
  return NextResponse.json({ agentIds });
}