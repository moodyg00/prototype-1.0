import { NextResponse } from 'next/server';
import {
  projectExists,
  getChatSession,
  updateChatSession,
  deleteChatSession,
} from '@/src/lib/projects';

export const runtime = 'nodejs';

type Ctx = { params: Promise<{ slug: string; id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const { slug, id } = await params;
  if (!(await projectExists(slug))) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }
  const session = await getChatSession(slug, id);
  if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  return NextResponse.json({ session });
}

export async function PATCH(req: Request, { params }: Ctx) {
  const { slug, id } = await params;
  if (!(await projectExists(slug))) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }
  const body = (await req.json().catch(() => ({}))) as {
    messages?: unknown;
    title?: string;
    threadId?: string;
    todos?: unknown;
  };
  const session = await updateChatSession(slug, id, {
    messages: body.messages as Parameters<typeof updateChatSession>[2]['messages'],
    title: body.title,
    threadId: body.threadId,
    todos: body.todos as Parameters<typeof updateChatSession>[2]['todos'],
  });
  if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  return NextResponse.json({ session });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { slug, id } = await params;
  if (!(await projectExists(slug))) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }
  const ok = await deleteChatSession(slug, id);
  if (!ok) return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
