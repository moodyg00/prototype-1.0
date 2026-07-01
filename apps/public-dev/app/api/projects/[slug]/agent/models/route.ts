import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

type Ctx = { params: Promise<{ slug: string }> };

function agentBaseUrl(): string {
  return process.env.AGENT_BASE_URL?.trim() || 'http://localhost:3002';
}

/** Proxy model catalog + provider availability from the agent app. */
export async function GET(_req: Request, _ctx: Ctx) {
  try {
    const res = await fetch(`${agentBaseUrl()}/api/ide-agent/models`, { cache: 'no-store' });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      return NextResponse.json({ error: 'Could not load models' }, { status: 502 });
    }
    return NextResponse.json(json);
  } catch {
    return NextResponse.json({ error: 'Agent service unreachable' }, { status: 502 });
  }
}
