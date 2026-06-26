import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const res = await fetch('http://localhost:3001', {
      method: 'HEAD',
      signal: AbortSignal.timeout(2000),
    });
    return NextResponse.json({ running: res.ok || res.status < 500 });
  } catch {
    return NextResponse.json({ running: false });
  }
}
