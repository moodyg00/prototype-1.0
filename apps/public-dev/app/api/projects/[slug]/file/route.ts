import { NextResponse } from 'next/server';
import { z } from 'zod';
import { deleteFile, projectExists, readFile, writeFile } from '@/src/lib/projects';

export const runtime = 'nodejs';

type Ctx = { params: Promise<{ slug: string }> };

export async function GET(req: Request, { params }: Ctx) {
  const { slug } = await params;
  if (!(await projectExists(slug))) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }
  const relPath = new URL(req.url).searchParams.get('path');
  if (!relPath) return NextResponse.json({ error: 'Missing path' }, { status: 400 });
  try {
    const content = await readFile(slug, relPath);
    return NextResponse.json({ path: relPath, content });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}

const WriteSchema = z.object({
  path: z.string().min(1),
  content: z.string(),
});

export async function PUT(req: Request, { params }: Ctx) {
  const { slug } = await params;
  if (!(await projectExists(slug))) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }
  const parsed = WriteSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  try {
    await writeFile(slug, parsed.data.path, parsed.data.content);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}

export async function DELETE(req: Request, { params }: Ctx) {
  const { slug } = await params;
  if (!(await projectExists(slug))) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }
  const relPath = new URL(req.url).searchParams.get('path');
  if (!relPath) return NextResponse.json({ error: 'Missing path' }, { status: 400 });
  try {
    await deleteFile(slug, relPath);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
