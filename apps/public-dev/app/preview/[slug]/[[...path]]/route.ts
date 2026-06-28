import { NextResponse } from 'next/server';
import { existsSync } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { projectExists, resolveInProject, toProjectRelative } from '@/src/lib/projects';

export const runtime = 'nodejs';

const CONTENT_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.htm': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
};

type Ctx = { params: Promise<{ slug: string; path?: string[] }> };

/**
 * Inject a <base> tag so a served page's relative links resolve against its
 * own directory inside /preview/<slug>/, independent of whether the request
 * URL had a trailing slash. This avoids fighting Next's trailing-slash
 * normalization while keeping plain static HTML working unmodified.
 */
function injectBase(html: string, baseHref: string): string {
  const tag = `<base href="${baseHref}">`;
  if (/<base\b/i.test(html)) return html;
  if (/<head[^>]*>/i.test(html)) {
    return html.replace(/<head[^>]*>/i, (m) => `${m}\n    ${tag}`);
  }
  if (/<html[^>]*>/i.test(html)) {
    return html.replace(/<html[^>]*>/i, (m) => `${m}\n<head>${tag}</head>`);
  }
  return `${tag}\n${html}`;
}

export async function GET(_req: Request, { params }: Ctx) {
  const { slug, path: segments } = await params;
  if (!(await projectExists(slug))) {
    return new NextResponse('Project not found', { status: 404 });
  }

  const rel = (segments ?? []).join('/');

  let abs: string;
  try {
    abs = resolveInProject(slug, rel || '.');
  } catch {
    return new NextResponse('Forbidden', { status: 403 });
  }

  let stat = existsSync(abs) ? await fs.stat(abs) : null;
  if (stat?.isDirectory()) {
    abs = path.join(abs, 'index.html');
    stat = existsSync(abs) ? await fs.stat(abs) : null;
  }

  if (!stat || !stat.isFile()) {
    return new NextResponse('Not found', { status: 404 });
  }

  const ext = path.extname(abs).toLowerCase();
  const type = CONTENT_TYPES[ext] ?? 'application/octet-stream';

  if (ext === '.html' || ext === '.htm') {
    const html = await fs.readFile(abs, 'utf8');
    const relFromRoot = toProjectRelative(slug, abs);
    const dir = path.posix.dirname(relFromRoot);
    const baseHref = `/preview/${slug}/${dir && dir !== '.' ? dir + '/' : ''}`;
    return new NextResponse(injectBase(html, baseHref), {
      status: 200,
      headers: { 'Content-Type': type, 'Cache-Control': 'no-store' },
    });
  }

  const data = await fs.readFile(abs);
  return new NextResponse(new Uint8Array(data), {
    status: 200,
    headers: { 'Content-Type': type, 'Cache-Control': 'no-store' },
  });
}
