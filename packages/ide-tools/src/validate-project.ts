import { existsSync } from 'node:fs';
import path from 'node:path';

import { getProjectRoot, listFiles, readFile } from './project-fs';
import type { FileNode } from './types';

export type ValidateIssue = {
  severity: 'error' | 'warning';
  file: string;
  message: string;
};

export type ValidateProjectResult = {
  ok: boolean;
  errorCount: number;
  warningCount: number;
  checkedHtml: number;
  checkedCss: number;
  issues: ValidateIssue[];
};

function flattenFiles(nodes: FileNode[], acc: string[] = []): string[] {
  for (const n of nodes) {
    if (n.type === 'dir') {
      if (n.children) flattenFiles(n.children, acc);
    } else {
      acc.push(n.path);
    }
  }
  return acc;
}

function isExternalRef(ref: string): boolean {
  const r = ref.trim();
  return (
    !r ||
    r.startsWith('http://') ||
    r.startsWith('https://') ||
    r.startsWith('//') ||
    r.startsWith('#') ||
    r.startsWith('mailto:') ||
    r.startsWith('tel:') ||
    r.startsWith('data:') ||
    r.startsWith('javascript:')
  );
}

function resolveProjectRef(fromFile: string, ref: string): string {
  const dir = path.posix.dirname(fromFile.replace(/\\/g, '/'));
  const joined = path.posix.normalize(path.posix.join(dir, ref));
  return joined.replace(/^\.\//, '');
}

function extractHtmlRefs(html: string): Array<{ attr: string; value: string }> {
  const refs: Array<{ attr: string; value: string }> = [];
  const re = /\b(href|src)=["']([^"']+)["']/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    refs.push({ attr: m[1].toLowerCase(), value: m[2] });
  }
  return refs;
}

function extractCssImports(css: string): string[] {
  const imports: string[] = [];
  const re = /@import\s+["']([^"']+)["']/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(css))) {
    imports.push(m[1]);
  }
  return imports;
}

/** Rough brace balance ignoring strings and comments well enough for static CSS. */
export function cssBraceBalance(css: string): { open: number; close: number } {
  let open = 0;
  let close = 0;
  let i = 0;
  while (i < css.length) {
    const ch = css[i];
    if (ch === '/' && css[i + 1] === '*') {
      const end = css.indexOf('*/', i + 2);
      i = end === -1 ? css.length : end + 2;
      continue;
    }
    if (ch === '"' || ch === "'") {
      const quote = ch;
      i += 1;
      while (i < css.length && css[i] !== quote) {
        if (css[i] === '\\') i += 1;
        i += 1;
      }
      i += 1;
      continue;
    }
    if (ch === '{') open += 1;
    if (ch === '}') close += 1;
    i += 1;
  }
  return { open, close };
}

function fileExistsInProject(slug: string, relPath: string): boolean {
  try {
    return existsSync(path.join(getProjectRoot(slug), relPath));
  } catch {
    return false;
  }
}

/**
 * Lightweight static-site sanity checks: broken relative links, empty assets,
 * and unbalanced CSS braces.
 */
export async function validateProject(slug: string): Promise<ValidateProjectResult> {
  const tree = await listFiles(slug);
  const paths = flattenFiles(tree).filter((p) => !p.startsWith('.agent/'));
  const issues: ValidateIssue[] = [];

  const htmlFiles = paths.filter((p) => p.endsWith('.html'));
  const cssFiles = paths.filter((p) => p.endsWith('.css'));

  for (const file of htmlFiles) {
    let html: string;
    try {
      html = await readFile(slug, file);
    } catch {
      issues.push({ severity: 'error', file, message: 'Could not read HTML file.' });
      continue;
    }

    if (!html.trim()) {
      issues.push({ severity: 'error', file, message: 'HTML file is empty.' });
      continue;
    }

    const openTags = (html.match(/<[a-z][a-z0-9]*\b[^>]*(?<!\/)>/gi) ?? []).length;
    const closeTags = (html.match(/<\/[a-z][a-z0-9]*>/gi) ?? []).length;
    if (Math.abs(openTags - closeTags) > 5) {
      issues.push({
        severity: 'warning',
        file,
        message: `Tag count skew (open≈${openTags}, close≈${closeTags}) — possible unclosed markup.`,
      });
    }

    for (const ref of extractHtmlRefs(html)) {
      if (isExternalRef(ref.value)) continue;
      const target = resolveProjectRef(file, ref.value.split('#')[0]!);
      if (!fileExistsInProject(slug, target)) {
        issues.push({
          severity: 'error',
          file,
          message: `Broken ${ref.attr} reference: ${ref.value} → ${target} (missing)`,
        });
      }
    }
  }

  for (const file of cssFiles) {
    let css: string;
    try {
      css = await readFile(slug, file);
    } catch {
      issues.push({ severity: 'error', file, message: 'Could not read CSS file.' });
      continue;
    }

    if (!css.trim()) {
      issues.push({ severity: 'error', file, message: 'CSS file is empty.' });
      continue;
    }

    const { open, close } = cssBraceBalance(css);
    if (open !== close) {
      issues.push({
        severity: 'error',
        file,
        message: `Unbalanced braces ({ ${open} vs } ${close}).`,
      });
    }

    for (const imp of extractCssImports(css)) {
      const target = resolveProjectRef(file, imp.split('#')[0]!);
      if (!fileExistsInProject(slug, target)) {
        issues.push({
          severity: 'error',
          file,
          message: `Broken @import: ${imp} → ${target} (missing)`,
        });
      }
    }
  }

  const errorCount = issues.filter((i) => i.severity === 'error').length;
  const warningCount = issues.filter((i) => i.severity === 'warning').length;

  return {
    ok: errorCount === 0,
    errorCount,
    warningCount,
    checkedHtml: htmlFiles.length,
    checkedCss: cssFiles.length,
    issues,
  };
}
