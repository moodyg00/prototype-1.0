import { NextResponse } from 'next/server';
import {
  getPureBrowserState,
  stopPureBrowser,
} from '@/app/api/pure-browser/state';

export async function GET() {
  const s = getPureBrowserState();
  return NextResponse.json({
    running: s.running,
    lines: [...s.lines],
  });
}

export async function POST() {
  stopPureBrowser();
  return NextResponse.json({ ok: true });
}
