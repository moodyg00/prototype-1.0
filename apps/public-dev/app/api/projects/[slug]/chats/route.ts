import { NextResponse } from 'next/server';
import { projectExists, listChatSessions, createChatSession } from '@/src/lib/projects';

export const runtime = 'nodejs';

type Ctx = { params: Promise<{ slug: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const { slug } = await params;
  if (!(await projectExists(slug))) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }
  const sessions = await listChatSessions(slug);
  return NextResponse.json({ sessions });
}

export async function POST(req: Request, { params }: Ctx) {
  const { slug } = await params;
  if (!(await projectExists(slug))) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }
  const body = (await req.json().catch(() => ({}))) as { title?: string };
  const session = await createChatSession(slug, body.title);
  return NextResponse.json({ session });
}
