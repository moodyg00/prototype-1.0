import { NextResponse } from 'next/server';
import { runDemoAgent } from '@/src/agents/bootstrap';

export async function GET() {
  const result = await runDemoAgent(
    'Review current pipeline and surface any high-priority decisions or opportunities the human should address today.'
  );
  return NextResponse.json({ success: true, result });
}

export async function POST(req: Request) {
  const { prompt } = await req.json().catch(() => ({}));
  const result = await runDemoAgent(prompt || 'Generate useful work for the human admin.');
  return NextResponse.json({ success: true, result });
}
