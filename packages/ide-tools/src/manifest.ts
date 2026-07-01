import { existsSync } from 'node:fs';

import type { FileNode } from './types';

import { getProjectRoot, listFiles, readFile } from './project-fs';

function flattenPaths(nodes: FileNode[], acc: string[] = []): string[] {
  for (const n of nodes) {
    if (n.type === 'dir') {
      if (n.children) flattenPaths(n.children, acc);
    } else {
      acc.push(n.path);
    }
  }
  return acc;
}

function extractStylesheetLinks(html: string): string[] {
  const links: string[] = [];
  const re = /<link[^>]+rel=["']stylesheet["'][^>]*>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const href = m[0].match(/href=["']([^"']+)["']/i)?.[1];
    if (href && !href.startsWith('http')) links.push(href);
  }
  return links;
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

function extractHtmlPages(paths: string[]): string[] {
  return paths.filter((p) => p.endsWith('.html') && !p.startsWith('.agent/')).sort();
}

function extractCssFiles(paths: string[]): string[] {
  return paths.filter((p) => p.endsWith('.css') && !p.startsWith('.agent/')).sort();
}

/**
 * Build a compact project manifest injected into the IDE agent system context.
 * Helps the model find the right CSS file without guessing.
 */
export async function buildProjectManifest(slug: string): Promise<string> {
  const tree = await listFiles(slug);
  const paths = flattenPaths(tree);
  const pages = extractHtmlPages(paths);
  const cssFiles = extractCssFiles(paths);

  const lines: string[] = [
    `## Project manifest (${slug})`,
    '',
    `HTML pages (${pages.length}): ${pages.slice(0, 12).join(', ') || '(none)'}`,
    `CSS files (${cssFiles.length}): ${cssFiles.join(', ') || '(none)'}`,
    '',
  ];

  const root = getProjectRoot(slug);
  const indexPath = `${root}/index.html`;
  if (existsSync(indexPath)) {
    try {
      const indexHtml = await readFile(slug, 'index.html');
      const sheetLinks = extractStylesheetLinks(indexHtml);
      lines.push('index.html stylesheets:', ...sheetLinks.map((l) => `  - ${l}`), '');

      const mainCss = sheetLinks.find((l) => l.includes('styles.css')) ?? 'css/styles.css';
      if (paths.includes(mainCss.replace(/^\.\//, ''))) {
        try {
          const styles = await readFile(slug, mainCss.replace(/^\.\//, ''));
          const imports = extractCssImports(styles);
          if (imports.length) {
            lines.push(`${mainCss} @imports:`, ...imports.map((i) => `  - ${i}`), '');
          }
        } catch {
          /* ignore */
        }
      }

      if (indexHtml.includes('home-v1__hero')) {
        lines.push(
          'Home hero headline:',
          '  - Markup: index.html → section.home-v1__hero → h1',
          '  - Size override: css/public-home-variant.css → .home-v1__hero h1',
          '  - Default h1 weight: css/public-typography.css → h1 { font-weight: … }',
          '',
        );
      }
    } catch {
      /* ignore */
    }
  }

  lines.push(
    'Agent workspace (not deployed):',
    '  - .agent/scratch/plan.md — write your edit plan before touching production files',
    '  - .agent/scratch/notes.md — optional working notes',
    '  - Checkpoints are saved automatically before edits; use revert_checkpoint to undo.',
    '',
    'Edit protocol: read (note contentHash) → write_plan (multi-file) → patch_file (expect_hash) → validate_project.',
  );

  return lines.join('\n');
}
