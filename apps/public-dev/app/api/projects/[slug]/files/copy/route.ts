import { NextResponse } from 'next/server';
import { z } from 'zod';
import { duplicateFile, projectExists } from '@/src/lib/projects';

export const runtime = 'nodejs';

type Ctx = { params: Promise<{ slug: string }> };

const CopySchema = z.object({
  path: z.string().min(1),
});

export async function POST(req: Request, { params }: Ctx) {
  const { slug } = await params;
  if (!(await projectExists(slug))) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }
  const parsed = CopySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }
  const relPath = parsed.data.path.trim().replace(/\\/g, '/').replace(/^\/+/, '').replace(/\/+$/, '');
  if (!relPath || relPath.includes('..')) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
  }
  try {
    const dest = await duplicateFile(slug, relPath);
    return NextResponse.json({ ok: true, path: dest }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
