import { NextResponse } from 'next/server';

import { agentRuntime } from '@/lib/agents/runtime';

type Params = { params: Promise<{ agentId: string }> };

export async function POST(req: Request, { params }: Params) {
  const { agentId } = await params;
  const body = (await req.json()) as { prompt?: string };
  const prompt = body.prompt?.trim();
  if (!prompt) {
    return NextResponse.json({ error: 'prompt is required' }, { status: 400 });
  }

  try {
    const result = await agentRuntime.run(agentId, prompt);
    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Agent run failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}