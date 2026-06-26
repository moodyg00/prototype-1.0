import { NextRequest, NextResponse } from 'next/server';
import { getBrowserOperator } from '@/lib/operators/BrowserOperator';

export async function GET() {
  const op = getBrowserOperator();
  return NextResponse.json({ open: op.getLoginWindowOpen() });
}

export async function POST(req: NextRequest) {
  try {
    const { url } = (await req.json()) as { url?: string };
    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'url required' }, { status: 400 });
    }
    // Basic URL validation
    new URL(url);
    const op = getBrowserOperator();
    await op.openLoginBrowser(url);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const op = getBrowserOperator();
    await op.closeLoginBrowser();
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
