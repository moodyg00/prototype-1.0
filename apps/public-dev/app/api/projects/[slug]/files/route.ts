import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createFile, isDescendantOrSelf, listFiles, moveEntry, projectExists } from '@/src/lib/projects';

export const runtime = 'nodejs';

type Ctx = { params: Promise<{ slug: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const { slug } = await params;
  if (!(await projectExists(slug))) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }
  const tree = await listFiles(slug);
  return NextResponse.json({ tree });
}

const CreateSchema = z.object({
  path: z.string().min(1),
  kind: z.enum(['file', 'dir']).default('file'),
});

export async function POST(req: Request, { params }: Ctx) {
  const { slug } = await params;
  if (!(await projectExists(slug))) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }
  const parsed = CreateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }
  const relPath = parsed.data.path.trim().replace(/\\/g, '/').replace(/^\/+/, '').replace(/\/+$/, '');
  if (!relPath || relPath.includes('..')) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
  }
  try {
    await createFile(slug, relPath, parsed.data.kind);
    return NextResponse.json({ ok: true, path: relPath }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}

const MoveSchema = z.object({
  from: z.string().min(1),
  to: z.string().min(1),
});

export async function PATCH(req: Request, { params }: Ctx) {
  const { slug } = await params;
  if (!(await projectExists(slug))) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }
  const parsed = MoveSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }
  const from = parsed.data.from.trim().replace(/\\/g, '/').replace(/^\/+/, '').replace(/\/+$/, '');
  const to = parsed.data.to.trim().replace(/\\/g, '/').replace(/^\/+/, '').replace(/\/+$/, '');
  if (!from || !to || from.includes('..') || to.includes('..')) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
  }
  if (isDescendantOrSelf(from, to)) {
    return NextResponse.json({ error: 'Cannot move into itself or a descendant' }, { status: 400 });
  }
  try {
    await moveEntry(slug, from, to);
    return NextResponse.json({ ok: true, from, to });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
