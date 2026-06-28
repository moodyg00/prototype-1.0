import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getProject } from '@/src/lib/projects';
import { resolveTarget, rollback } from '@/src/lib/deploy';

export const runtime = 'nodejs';
export const maxDuration = 300;

type Ctx = { params: Promise<{ slug: string }> };

const BodySchema = z.object({ stamp: z.string().min(1), confirm: z.string() });

export async function POST(req: Request, { params }: Ctx) {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  if (parsed.data.confirm !== 'ROLLBACK') {
    return NextResponse.json(
      { error: 'Rollback requires explicit confirmation (confirm: "ROLLBACK").' },
      { status: 412 },
    );
  }

  try {
    const result = await rollback(slug, resolveTarget(project), parsed.data.stamp, project.deploy);
    return NextResponse.json({ result });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
