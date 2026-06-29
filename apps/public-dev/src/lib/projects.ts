import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { FileNode, ProjectMeta } from './types';

/**
 * All file access in this app is scoped to a single project directory under
 * apps/public-dev/sites/. Every path from the UI or the agent MUST pass through
 * {@link resolveInProject} so it can never escape the project root.
 */

export type { FileNode, ProjectMeta } from './types';

const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,62}$/;
const META_FILE = '.project.json';
const IGNORED_ENTRIES = new Set(['.git', 'node_modules', '.DS_Store']);

export function findRepoRoot(start = process.cwd()): string {
  let dir = start;
  for (let i = 0; i < 10; i += 1) {
    if (existsSync(path.join(dir, 'pnpm-workspace.yaml'))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return start;
}

/** Root of the @prototype/public-dev package (works in dev + Hostinger standalone). */
export function getPublicDevRoot(): string {
  if (process.env.PUBLIC_DEV_ROOT) return path.resolve(process.env.PUBLIC_DEV_ROOT);
  const cwd = process.cwd();
  if (existsSync(path.join(cwd, 'sites'))) return cwd;
  const repoRoot = findRepoRoot(cwd);
  return path.join(repoRoot, 'apps', 'public-dev');
}

export function getSitesRoot(): string {
  if (process.env.SITES_DIR) return path.resolve(process.env.SITES_DIR);
  return path.join(getPublicDevRoot(), 'sites');
}

/** Simulated production docroot locally; on Hostinger set DEPLOY_LIVE_DOCROOT to public_html. */
export function getDefaultLiveDocroot(): string {
  const raw = process.env.DEPLOY_LIVE_DOCROOT?.trim();
  if (raw) {
    if (raw.startsWith('~/') || raw === '~') return path.join(os.homedir(), raw.slice(1));
    return path.resolve(raw);
  }
  return path.join(findRepoRoot(), 'apps', 'public-site');
}

export function isValidSlug(slug: string): boolean {
  return typeof slug === 'string' && SLUG_RE.test(slug);
}

export function getProjectRoot(slug: string): string {
  if (!isValidSlug(slug)) throw new Error(`Invalid project slug: ${slug}`);
  return path.join(getSitesRoot(), slug);
}

/**
 * Resolve a project-relative path to an absolute path, guaranteeing the result
 * stays inside the project root. Throws on traversal attempts.
 */
export function resolveInProject(slug: string, relPath: string): string {
  const root = getProjectRoot(slug);
  const normalized = path
    .normalize(relPath || '.')
    .replace(/^([/\\])+/, '')
    .replace(/\\/g, '/');
  if (normalized === '..' || normalized.startsWith('../') || normalized.includes('/../')) {
    throw new Error(`Path escapes project: ${relPath}`);
  }
  const abs = path.resolve(root, normalized);
  const rootWithSep = root.endsWith(path.sep) ? root : root + path.sep;
  if (abs !== root && !abs.startsWith(rootWithSep)) {
    throw new Error(`Path escapes project: ${relPath}`);
  }
  return abs;
}

export function toProjectRelative(slug: string, abs: string): string {
  const root = getProjectRoot(slug);
  return path.relative(root, abs).split(path.sep).join('/');
}

async function readMeta(slug: string): Promise<ProjectMeta | null> {
  try {
    const raw = await fs.readFile(path.join(getProjectRoot(slug), META_FILE), 'utf8');
    const parsed = JSON.parse(raw) as Partial<ProjectMeta>;
    return {
      slug,
      name: parsed.name || slug,
      description: parsed.description,
      target: parsed.target || 'live',
      deploy: parsed.deploy,
      createdAt: parsed.createdAt || new Date().toISOString(),
      updatedAt: parsed.updatedAt || parsed.createdAt || new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

async function writeMeta(slug: string, meta: ProjectMeta): Promise<void> {
  // Slug is the folder name; don't duplicate it in the file.
  const { slug: _omit, ...persisted } = meta;
  await fs.writeFile(
    path.join(getProjectRoot(slug), META_FILE),
    JSON.stringify(persisted, null, 2) + '\n',
    'utf8',
  );
}

export async function updateProject(
  slug: string,
  patch: Partial<Pick<ProjectMeta, 'name' | 'description' | 'target' | 'deploy'>>,
): Promise<ProjectMeta> {
  const current = await getProject(slug);
  if (!current) throw new Error(`Project "${slug}" not found.`);
  // A key present in `patch` overrides current — including `deploy: undefined`,
  // which clears per-project overrides so they fall back to env.
  const next: ProjectMeta = {
    ...current,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  await writeMeta(slug, next);
  return next;
}

export async function listProjects(): Promise<ProjectMeta[]> {
  const root = getSitesRoot();
  await fs.mkdir(root, { recursive: true });
  const entries = await fs.readdir(root, { withFileTypes: true });
  const projects: ProjectMeta[] = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (entry.name.startsWith('.')) continue;
    if (!isValidSlug(entry.name)) continue;
    const meta =
      (await readMeta(entry.name)) ??
      ({
        slug: entry.name,
        name: entry.name,
        target: 'live',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as ProjectMeta);
    projects.push(meta);
  }
  return projects.sort((a, b) => a.name.localeCompare(b.name));
}

export async function projectExists(slug: string): Promise<boolean> {
  if (!isValidSlug(slug)) return false;
  try {
    const stat = await fs.stat(getProjectRoot(slug));
    return stat.isDirectory();
  } catch {
    return false;
  }
}

export async function getProject(slug: string): Promise<ProjectMeta | null> {
  if (!(await projectExists(slug))) return null;
  return (await readMeta(slug)) ?? {
    slug,
    name: slug,
    target: 'live',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

const DEFAULT_INDEX_HTML = (name: string) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${name}</title>
  <link rel="stylesheet" href="css/styles.css" />
</head>
<body>
  <main>
    <h1>${name}</h1>
    <p>New static site. Edit <code>index.html</code> to get started.</p>
  </main>
  <script src="js/main.js"></script>
</body>
</html>
`;

const DEFAULT_CSS = `:root {
  color-scheme: light dark;
  --maxw: 720px;
}
* { box-sizing: border-box; }
body {
  margin: 0;
  font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  line-height: 1.6;
}
main {
  max-width: var(--maxw);
  margin: 0 auto;
  padding: 4rem 1.25rem;
}
h1 { font-size: 2rem; }
`;

const DEFAULT_JS = `// ${'Static site JS — runs in the browser.'}
console.log("ready");
`;

export async function createProject(input: { slug: string; name?: string }): Promise<ProjectMeta> {
  const slug = input.slug;
  if (!isValidSlug(slug)) {
    throw new Error('Slug must be lowercase letters, numbers, and hyphens (max 63 chars).');
  }
  if (await projectExists(slug)) {
    throw new Error(`Project "${slug}" already exists.`);
  }
  const root = getProjectRoot(slug);
  const name = (input.name || slug).trim() || slug;
  await fs.mkdir(path.join(root, 'css'), { recursive: true });
  await fs.mkdir(path.join(root, 'js'), { recursive: true });
  await fs.writeFile(path.join(root, 'index.html'), DEFAULT_INDEX_HTML(name), 'utf8');
  await fs.writeFile(path.join(root, 'css', 'styles.css'), DEFAULT_CSS, 'utf8');
  await fs.writeFile(path.join(root, 'js', 'main.js'), DEFAULT_JS, 'utf8');
  const now = new Date().toISOString();
  const meta: ProjectMeta = { slug, name, target: 'live', createdAt: now, updatedAt: now };
  await writeMeta(slug, meta);
  return meta;
}

export async function touchProject(slug: string): Promise<void> {
  const meta = await readMeta(slug);
  if (!meta) return;
  meta.updatedAt = new Date().toISOString();
  await writeMeta(slug, meta);
}

async function buildTree(slug: string, absDir: string): Promise<FileNode[]> {
  const entries = await fs.readdir(absDir, { withFileTypes: true });
  const nodes: FileNode[] = [];
  for (const entry of entries) {
    if (IGNORED_ENTRIES.has(entry.name)) continue;
    if (entry.name === META_FILE) continue;
    const abs = path.join(absDir, entry.name);
    const rel = toProjectRelative(slug, abs);
    if (entry.isDirectory()) {
      nodes.push({
        name: entry.name,
        path: rel,
        type: 'dir',
        children: await buildTree(slug, abs),
      });
    } else if (entry.isFile()) {
      nodes.push({ name: entry.name, path: rel, type: 'file' });
    }
  }
  return nodes.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

export async function listFiles(slug: string): Promise<FileNode[]> {
  const root = getProjectRoot(slug);
  return buildTree(slug, root);
}

export async function readFile(slug: string, relPath: string): Promise<string> {
  const abs = resolveInProject(slug, relPath);
  return fs.readFile(abs, 'utf8');
}

export async function writeFile(slug: string, relPath: string, content: string): Promise<void> {
  const abs = resolveInProject(slug, relPath);
  await fs.mkdir(path.dirname(abs), { recursive: true });
  await fs.writeFile(abs, content, 'utf8');
  await touchProject(slug);
}

export async function deleteFile(slug: string, relPath: string): Promise<void> {
  const abs = resolveInProject(slug, relPath);
  if (abs === getProjectRoot(slug)) throw new Error('Refusing to delete project root.');
  await fs.rm(abs, { recursive: true, force: true });
  await touchProject(slug);
}

export async function createFile(
  slug: string,
  relPath: string,
  kind: 'file' | 'dir',
): Promise<void> {
  const trimmed = relPath.trim().replace(/\\/g, '/').replace(/^\/+/, '').replace(/\/+$/, '');
  if (!trimmed || trimmed === '.' || trimmed === '..') {
    throw new Error('Invalid path');
  }
  const abs = resolveInProject(slug, trimmed);
  const root = getProjectRoot(slug);
  if (abs === root) {
    throw new Error(kind === 'dir' ? 'Cannot create project root folder' : 'Cannot create a file at project root without a name');
  }
  if (existsSync(abs)) {
    throw new Error(kind === 'dir' ? 'Folder already exists' : 'File already exists');
  }
  if (kind === 'dir') {
    await fs.mkdir(abs, { recursive: true });
  } else {
    await fs.mkdir(path.dirname(abs), { recursive: true });
    await fs.writeFile(abs, '', 'utf8');
  }
  await touchProject(slug);
}
