import { NextResponse } from 'next/server';
import { getBrowserState, stopBrowserTask } from '@/app/api/browser/state';

export async function GET() {
  const s = getBrowserState();
  return NextResponse.json({
    running: s.running,
    lines: [...s.lines],
  });
}

export async function POST() {
  stopBrowserTask();
  return NextResponse.json({ ok: true });
}
