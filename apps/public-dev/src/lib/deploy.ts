import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import SftpClient from 'ssh2-sftp-client';
import { getProjectRoot, getSitesRoot, isValidSlug, type ProjectMeta } from '@/src/lib/projects';
import type { DeployFileChange, DeployOverrides, DeployPlan, DeployResult } from '@/src/lib/types';

/**
 * SSH/SFTP deployer. Pushes a project's static files to a remote docroot using
 * key-based auth. Config is target-driven; v1 ships a single "live" target read
 * from DEPLOY_LIVE_* env vars.
 */

export type DeployTargetConfig = {
  target: string;
  host: string;
  port: number;
  username: string;
  privateKeyPath: string;
  passphrase?: string;
  docroot: string;
};

const DEFAULT_IGNORES = ['.git', 'node_modules', '.DS_Store', '.project.json', '.deploy-ignore'];

function expandHome(p: string): string {
  if (p.startsWith('~/') || p === '~') return path.join(os.homedir(), p.slice(1));
  return p;
}

export function getDeployConfig(target = 'live', overrides?: DeployOverrides): DeployTargetConfig {
  if (target !== 'live') {
    throw new Error(`Unknown deploy target "${target}". Only "live" is configured.`);
  }
  // Per-project overrides take precedence over the target's env config.
  const host = (overrides?.host?.trim() || process.env.DEPLOY_LIVE_HOST?.trim()) || '';
  const username = (overrides?.user?.trim() || process.env.DEPLOY_LIVE_USER?.trim()) || '';
  const docroot = (overrides?.docroot?.trim() || process.env.DEPLOY_LIVE_DOCROOT?.trim()) || '';
  const keyPath = overrides?.sshKeyPath?.trim() || process.env.DEPLOY_LIVE_SSH_KEY?.trim() || '~/.ssh/id_ed25519';
  const privateKeyPath = expandHome(keyPath);
  const port = overrides?.port || Number(process.env.DEPLOY_LIVE_PORT || 22);
  const missing: string[] = [];
  if (!host) missing.push('host (DEPLOY_LIVE_HOST)');
  if (!username) missing.push('user (DEPLOY_LIVE_USER)');
  if (!docroot) missing.push('docroot (DEPLOY_LIVE_DOCROOT)');
  if (missing.length) {
    throw new Error(
      `Deploy target "live" is not configured. Missing: ${missing.join(', ')}. Set these in the project's Settings or in apps/public-dev/.env.local.`,
    );
  }
  return {
    target,
    host,
    port,
    username,
    privateKeyPath,
    passphrase: process.env.DEPLOY_LIVE_SSH_PASSPHRASE?.trim() || undefined,
    docroot,
  };
}

export function resolveTarget(project: ProjectMeta): string {
  return project.target || 'live';
}

type IgnoreMatcher = (rel: string) => boolean;

async function loadIgnore(slug: string): Promise<IgnoreMatcher> {
  const file = path.join(getProjectRoot(slug), '.deploy-ignore');
  let patterns: string[] = [];
  if (existsSync(file)) {
    const raw = await fs.readFile(file, 'utf8');
    patterns = raw
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith('#'));
  }
  const regexes = patterns.map((p) => {
    const clean = p.replace(/\/$/, '');
    const escaped = clean.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '[^/]*');
    // Match the pattern itself or anything beneath it (for directory patterns).
    return new RegExp(`^${escaped}(?:/.*)?$`);
  });
  return (rel: string) => regexes.some((re) => re.test(rel));
}

async function walk(
  slug: string,
  absDir: string,
  baseRel: string,
  files: { rel: string; abs: string; size: number }[],
  dirs: string[],
  ignored: string[],
  ignore: IgnoreMatcher,
): Promise<void> {
  const entries = await fs.readdir(absDir, { withFileTypes: true });
  for (const entry of entries) {
    if (DEFAULT_IGNORES.includes(entry.name)) continue;
    const rel = baseRel ? `${baseRel}/${entry.name}` : entry.name;
    if (ignore(rel)) {
      ignored.push(rel);
      continue;
    }
    const abs = path.join(absDir, entry.name);
    if (entry.isDirectory()) {
      dirs.push(rel);
      await walk(slug, abs, rel, files, dirs, ignored, ignore);
    } else if (entry.isFile()) {
      const stat = await fs.stat(abs);
      files.push({ rel, abs, size: stat.size });
    }
  }
}

export async function buildDeployPlan(
  slug: string,
  target: string,
  overrides?: DeployOverrides,
): Promise<DeployPlan> {
  if (!isValidSlug(slug)) throw new Error('Invalid slug');
  const config = getDeployConfig(target, overrides);
  const root = getProjectRoot(slug);
  const files: { rel: string; abs: string; size: number }[] = [];
  const dirs: string[] = [];
  const ignored: string[] = [];
  const ignore = await loadIgnore(slug);
  await walk(slug, root, '', files, dirs, ignored, ignore);

  const changes: DeployFileChange[] = [
    ...dirs.sort().map((d) => ({ path: d + '/', action: 'create-dir' as const })),
    ...files
      .sort((a, b) => a.rel.localeCompare(b.rel))
      .map((f) => ({ path: f.rel, action: 'upload' as const, size: f.size })),
  ];

  return {
    target: config.target,
    remoteDocroot: config.docroot,
    host: config.host,
    files: changes,
    totalBytes: files.reduce((sum, f) => sum + f.size, 0),
    ignored,
  };
}

async function loadPrivateKey(config: DeployTargetConfig): Promise<Buffer> {
  if (!existsSync(config.privateKeyPath)) {
    throw new Error(
      `SSH private key not found at ${config.privateKeyPath}. Set DEPLOY_LIVE_SSH_KEY to a valid private key path.`,
    );
  }
  return fs.readFile(config.privateKeyPath);
}

async function connect(config: DeployTargetConfig): Promise<SftpClient> {
  const sftp = new SftpClient();
  await sftp.connect({
    host: config.host,
    port: config.port,
    username: config.username,
    privateKey: await loadPrivateKey(config),
    passphrase: config.passphrase,
    readyTimeout: 20000,
  });
  return sftp;
}

/** Verify connectivity + that the remote docroot exists/is reachable. */
export async function testConnection(
  target = 'live',
  overrides?: DeployOverrides,
): Promise<{ ok: boolean; docrootExists: boolean; host: string; docroot: string }> {
  const config = getDeployConfig(target, overrides);
  const sftp = await connect(config);
  try {
    const type = await sftp.exists(config.docroot);
    return { ok: true, docrootExists: type === 'd', host: config.host, docroot: config.docroot };
  } finally {
    await sftp.end();
  }
}

function backupDir(slug: string, stamp: string): string {
  return path.join(getSitesRoot(), '..', 'apps', 'public-dev', '.deploy', 'backups', slug, stamp);
}

async function backupRemote(sftp: SftpClient, config: DeployTargetConfig, slug: string): Promise<string> {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const local = backupDir(slug, stamp);
  await fs.mkdir(local, { recursive: true });
  const exists = await sftp.exists(config.docroot);
  if (exists === 'd') {
    await sftp.downloadDir(config.docroot, local);
  }
  return local;
}

export async function executeDeploy(
  slug: string,
  target: string,
  options: { backup: boolean; overrides?: DeployOverrides },
): Promise<DeployResult> {
  const startedAt = new Date().toISOString();
  const config = getDeployConfig(target, options.overrides);
  const plan = await buildDeployPlan(slug, target, options.overrides);
  const root = getProjectRoot(slug);
  const sftp = await connect(config);

  let backupPath: string | undefined;
  let uploaded = 0;
  let bytes = 0;

  try {
    if (options.backup) {
      backupPath = await backupRemote(sftp, config, slug);
    }

    await sftp.mkdir(config.docroot, true).catch(() => {});

    for (const change of plan.files) {
      if (change.action === 'create-dir') {
        const remote = `${config.docroot}/${change.path.replace(/\/$/, '')}`;
        await sftp.mkdir(remote, true).catch(() => {});
      }
    }
    for (const change of plan.files) {
      if (change.action === 'upload') {
        const localAbs = path.join(root, change.path);
        const remote = `${config.docroot}/${change.path}`;
        const remoteParent = path.posix.dirname(remote);
        await sftp.mkdir(remoteParent, true).catch(() => {});
        await sftp.put(localAbs, remote);
        uploaded += 1;
        bytes += change.size ?? 0;
      }
    }
  } finally {
    await sftp.end();
  }

  const result: DeployResult = {
    uploaded,
    bytes,
    backupPath,
    startedAt,
    finishedAt: new Date().toISOString(),
  };
  await appendAuditLog({ slug, target, ...result });
  return result;
}

export type AuditEntry = {
  slug: string;
  target: string;
  uploaded: number;
  bytes: number;
  backupPath?: string;
  startedAt: string;
  finishedAt: string;
};

function auditLogPath(): string {
  return path.join(getSitesRoot(), '..', 'apps', 'public-dev', '.deploy', 'audit.log');
}

export async function appendAuditLog(entry: AuditEntry): Promise<void> {
  const file = auditLogPath();
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.appendFile(file, JSON.stringify(entry) + '\n', 'utf8');
}

export async function readAuditLog(slug?: string, limit = 50): Promise<AuditEntry[]> {
  const file = auditLogPath();
  if (!existsSync(file)) return [];
  const raw = await fs.readFile(file, 'utf8');
  const entries = raw
    .split('\n')
    .filter(Boolean)
    .map((l) => {
      try {
        return JSON.parse(l) as AuditEntry;
      } catch {
        return null;
      }
    })
    .filter((e): e is AuditEntry => e != null);
  const filtered = slug ? entries.filter((e) => e.slug === slug) : entries;
  return filtered.slice(-limit).reverse();
}

export async function listBackups(slug: string): Promise<{ stamp: string; path: string }[]> {
  const dir = path.join(getSitesRoot(), '..', 'apps', 'public-dev', '.deploy', 'backups', slug);
  if (!existsSync(dir)) return [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  return entries
    .filter((e) => e.isDirectory())
    .map((e) => ({ stamp: e.name, path: path.join(dir, e.name) }))
    .sort((a, b) => b.stamp.localeCompare(a.stamp));
}

/** Re-upload a previously captured backup to the remote docroot. */
export async function rollback(
  slug: string,
  target: string,
  stamp: string,
  overrides?: DeployOverrides,
): Promise<DeployResult> {
  const startedAt = new Date().toISOString();
  const config = getDeployConfig(target, overrides);
  const local = path.join(getSitesRoot(), '..', 'apps', 'public-dev', '.deploy', 'backups', slug, stamp);
  if (!existsSync(local)) throw new Error(`Backup not found: ${stamp}`);
  const sftp = await connect(config);
  let uploaded = 0;
  try {
    await sftp.mkdir(config.docroot, true).catch(() => {});
    uploaded = await uploadDirCount(sftp, local, config.docroot);
  } finally {
    await sftp.end();
  }
  const result: DeployResult = {
    uploaded,
    bytes: 0,
    startedAt,
    finishedAt: new Date().toISOString(),
  };
  await appendAuditLog({ slug, target: `${target} (rollback ${stamp})`, ...result });
  return result;
}

async function uploadDirCount(sftp: SftpClient, localDir: string, remoteDir: string): Promise<number> {
  let count = 0;
  const entries = await fs.readdir(localDir, { withFileTypes: true });
  await sftp.mkdir(remoteDir, true).catch(() => {});
  for (const entry of entries) {
    const localAbs = path.join(localDir, entry.name);
    const remote = `${remoteDir}/${entry.name}`;
    if (entry.isDirectory()) {
      count += await uploadDirCount(sftp, localAbs, remote);
    } else if (entry.isFile()) {
      await sftp.put(localAbs, remote);
      count += 1;
    }
  }
  return count;
}
