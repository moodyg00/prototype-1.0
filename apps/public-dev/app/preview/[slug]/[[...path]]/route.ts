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

/**
 * Inject `data-dev-source="<file>:<line>"` into every HTML element's opening
 * tag, where `<line>` is the 1-based line number of that opening tag in the raw
 * on-disk file and `<file>` is the project-relative path. This gives the agent a
 * line-accurate source location when the user visually selects an element.
 *
 * Only used when the IDE requests the preview with ?design=1, and run BEFORE
 * injectBase/injectDesignMode so the captured line numbers match the real source
 * file the agent will edit. Dependency-free: plain string/regex scanning that
 * respects quoted attribute values and skips raw-text element contents.
 */
function annotateDesignSource(html: string, file: string): string {
  // Matches opening tags only: the char after `<` must be a letter, so this
  // naturally skips closing tags (`</…`), comments (`<!--`) and doctype (`<!…`).
  // Quoted attribute values are consumed whole so a `>` inside a string doesn't
  // prematurely end the tag.
  const tagRe = /<([a-zA-Z][\w-]*)((?:"[^"]*"|'[^']*'|[^>"'])*)>/g;
  const rawText = new Set(['script', 'style', 'textarea', 'title']);

  let out = '';
  let last = 0;
  let m: RegExpExecArray | null;

  while ((m = tagRe.exec(html)) !== null) {
    const [full, name, attrs] = m;
    const start = m.index;
    const tagNameEnd = start + 1 + name.length;

    // Emit everything up to and including the tag name unchanged.
    out += html.slice(last, tagNameEnd);

    if (/\bdata-dev-source\s*=/i.test(attrs)) {
      // Already annotated — leave the tag's attributes untouched.
      out += html.slice(tagNameEnd, start + full.length);
    } else {
      const line = html.slice(0, start).split('\n').length;
      out += ` data-dev-source="${file}:${line}"`;
      out += attrs + '>';
    }

    last = start + full.length;

    // For raw-text elements, skip ahead to the matching closing tag so JS/CSS
    // content (e.g. `a<b` inside a script) is never run through the matcher.
    const selfClosing = attrs.trimEnd().endsWith('/');
    if (!selfClosing && rawText.has(name.toLowerCase())) {
      const closeRe = new RegExp(`</${name}\\s*>`, 'i');
      closeRe.lastIndex = last;
      const rest = html.slice(last);
      const closeMatch = rest.match(closeRe);
      if (closeMatch && closeMatch.index !== undefined) {
        const closeEnd = last + closeMatch.index + closeMatch[0].length;
        out += html.slice(last, closeEnd);
        last = closeEnd;
        tagRe.lastIndex = last;
      }
    }
  }

  out += html.slice(last);
  return out;
}

/**
 * Inject the Design Mode bridge script. Only used when the IDE requests the
 * preview with ?design=1, so normal browsing / deploy output is untouched. The
 * script is root-absolute (ignores <base>) and same-origin with the IDE so its
 * postMessage bridge works.
 */
function injectDesignMode(html: string): string {
  const tag = `<script src="/design-mode.js" data-design-mode></script>`;
  if (/<\/body>/i.test(html)) {
    return html.replace(/<\/body>/i, `  ${tag}\n</body>`);
  }
  return `${html}\n${tag}`;
}

export async function GET(req: Request, { params }: Ctx) {
  const { slug, path: segments } = await params;
  const designMode = new URL(req.url).searchParams.get('design') === '1';
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
    let out = html;
    if (designMode) out = annotateDesignSource(out, relFromRoot);
    out = injectBase(out, baseHref);
    if (designMode) out = injectDesignMode(out);
    return new NextResponse(out, {
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
