import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getProject, updateProject } from '@/src/lib/projects';

export const runtime = 'nodejs';

type Ctx = { params: Promise<{ slug: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  return NextResponse.json({ project });
}

const DeploySchema = z.object({
  host: z.string().optional(),
  port: z.number().int().positive().optional(),
  user: z.string().optional(),
  sshKeyPath: z.string().optional(),
  docroot: z.string().optional(),
});

const PatchSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  description: z.string().max(500).optional(),
  target: z.string().min(1).optional(),
  deploy: DeploySchema.optional(),
});

export async function PATCH(req: Request, { params }: Ctx) {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

  const parsed = PatchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', issues: parsed.error.issues }, { status: 400 });
  }

  // Normalize: drop empty-string deploy override fields so they fall back to env.
  let deploy = parsed.data.deploy;
  if (deploy) {
    const cleaned: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(deploy)) {
      if (v !== '' && v != null) cleaned[k] = v;
    }
    deploy = Object.keys(cleaned).length ? (cleaned as typeof deploy) : undefined;
  }

  try {
    const updated = await updateProject(slug, { ...parsed.data, deploy });
    return NextResponse.json({ project: updated });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
