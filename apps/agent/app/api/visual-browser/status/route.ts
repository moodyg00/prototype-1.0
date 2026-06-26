import { NextResponse } from 'next/server';
import { getBrowserOperator } from '@/lib/operators/BrowserOperator';

/**
 * Polled by the frontend to get live state from the running visual browser operator:
 * - current live screenshot (for LiveBrowserView — the operator emphasizes screenshot for visual understanding of interactables)
 * - events (for EventStream)
 * - capturedScreenshots (for the Output gallery)
 * - finalAnswer (text result)
 * - running status
 */
export async function GET() {
  try {
    const op = getBrowserOperator();
    const view = op.getCurrentView();
    const events = op.getEvents();
    const caps = op.getCapturedScreenshots();
    const final = op.getFinalAnswer();

    // Lightweight: send base64 only for the main current view + the last 6 captures
    return NextResponse.json({
      running: (op as any).running ?? false,
      loginWindowOpen: op.getLoginWindowOpen(),
      credentialRequired: op.getCredentialRequired(),
      startupError: op.getStartupError(),
      view: {
        ...view,
      },
      events: events.slice(-60),
      capturedScreenshots: caps.slice(-8),
      finalAnswer: final,
      connectInfo: op.connectInfo,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST() {
  // Allow stop via POST for simplicity
  try {
    const op = getBrowserOperator();
    op.stop();
    return NextResponse.json({ ok: true, stopped: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE() {
  // Reset browser context so next run reconnects (e.g. to a real Chrome on CDP port 9222)
  try {
    const op = getBrowserOperator();
    await op.resetBrowser();
    return NextResponse.json({ ok: true, reset: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
