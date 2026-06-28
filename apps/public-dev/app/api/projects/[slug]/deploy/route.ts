import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getProject } from '@/src/lib/projects';
import { buildDeployPlan, executeDeploy, resolveTarget, testConnection } from '@/src/lib/deploy';

export const runtime = 'nodejs';
export const maxDuration = 300;

type Ctx = { params: Promise<{ slug: string }> };

const BodySchema = z.object({
  mode: z.enum(['plan', 'execute', 'test']),
  backup: z.boolean().optional().default(true),
  confirm: z.string().optional(),
});

export async function POST(req: Request, { params }: Ctx) {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });

  const target = resolveTarget(project);
  const overrides = project.deploy;

  try {
    if (parsed.data.mode === 'test') {
      const probe = await testConnection(target, overrides);
      return NextResponse.json({ test: probe });
    }

    if (parsed.data.mode === 'plan') {
      const plan = await buildDeployPlan(slug, target, overrides);
      return NextResponse.json({ plan });
    }

    // execute — require explicit confirmation token from the UI.
    if (parsed.data.confirm !== 'DEPLOY') {
      return NextResponse.json(
        { error: 'Deploy requires explicit confirmation (confirm: "DEPLOY").' },
        { status: 412 },
      );
    }
    const result = await executeDeploy(slug, target, { backup: parsed.data.backup, overrides });
    return NextResponse.json({ result });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
