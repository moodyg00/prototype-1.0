import { NextRequest, NextResponse } from 'next/server';
import { getBrowserOperator } from '@/lib/operators/BrowserOperator';

/**
 * Headed-Chrome login capture. This is the one capability the old vision-based
 * "visual browser" had that pure-browser (headless CDP) does not: opening a real,
 * visible browser window so a human can complete a login/2FA flow, then persisting
 * the resulting session for future headless runs. It intentionally still reuses
 * BrowserOperator's Playwright session (not the vision task-execution loop, which
 * has been removed) purely for this session-capture + secure-credential-injection
 * capability.
 */
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
