import { NextResponse } from 'next/server';
import { projectExists, uploadFiles } from '@/src/lib/projects';

export const runtime = 'nodejs';

type Ctx = { params: Promise<{ slug: string }> };

export async function POST(req: Request, { params }: Ctx) {
  const { slug } = await params;
  if (!(await projectExists(slug))) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Expected multipart form data' }, { status: 400 });
  }

  const basePath = String(form.get('basePath') ?? '')
    .trim()
    .replace(/\\/g, '/')
    .replace(/^\/+/, '')
    .replace(/\/+$/, '');

  if (basePath.includes('..')) {
    return NextResponse.json({ error: 'Invalid base path' }, { status: 400 });
  }

  const fileEntries = form.getAll('files');
  const pathEntries = form.getAll('paths');

  if (fileEntries.length === 0) {
    return NextResponse.json({ error: 'No files provided' }, { status: 400 });
  }

  const uploads: { relPath: string; data: Buffer }[] = [];
  for (let i = 0; i < fileEntries.length; i += 1) {
    const entry = fileEntries[i];
    if (!(entry instanceof File)) continue;
    const relPath = String(pathEntries[i] ?? entry.name)
      .trim()
      .replace(/\\/g, '/')
      .replace(/^\/+/, '');
    if (!relPath || relPath.includes('..')) {
      return NextResponse.json({ error: `Invalid path: ${relPath}` }, { status: 400 });
    }
    const buf = Buffer.from(await entry.arrayBuffer());
    uploads.push({ relPath, data: buf });
  }

  if (uploads.length === 0) {
    return NextResponse.json({ error: 'No valid files provided' }, { status: 400 });
  }

  try {
    const written = await uploadFiles(slug, basePath, uploads);
    return NextResponse.json({ ok: true, paths: written, count: written.length }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
