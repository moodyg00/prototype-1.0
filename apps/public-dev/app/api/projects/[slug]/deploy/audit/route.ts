import { NextResponse } from 'next/server';
import { listBackups, readAuditLog } from '@/src/lib/deploy';
import { projectExists } from '@/src/lib/projects';

export const runtime = 'nodejs';

type Ctx = { params: Promise<{ slug: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const { slug } = await params;
  if (!(await projectExists(slug))) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }
  const [entries, backups] = await Promise.all([readAuditLog(slug), listBackups(slug)]);
  return NextResponse.json({ entries, backups });
}
