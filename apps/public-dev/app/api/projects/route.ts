import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createProject, listProjects } from '@/src/lib/projects';

export const runtime = 'nodejs';

export async function GET() {
  const projects = await listProjects();
  return NextResponse.json({ projects });
}

const CreateSchema = z.object({
  slug: z.string().min(1).max(63),
  name: z.string().max(120).optional(),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', issues: parsed.error.issues }, { status: 400 });
  }
  try {
    const project = await createProject(parsed.data);
    return NextResponse.json({ project }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
