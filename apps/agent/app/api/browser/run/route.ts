import { NextRequest, NextResponse } from 'next/server';
import { startBrowserTask } from '@/app/api/browser/state';

export async function POST(req: NextRequest) {
  let body: { task?: string; url?: string } = {};
  try { body = await req.json(); } catch { /* empty body ok */ }
  const { task, url } = body;
  if (!task) {
    return NextResponse.json({ error: 'task is required' }, { status: 400 });
  }
  startBrowserTask(task, url || 'https://www.google.com');
  return NextResponse.json({ ok: true });
}
