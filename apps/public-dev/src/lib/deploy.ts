import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import SftpClient from 'ssh2-sftp-client';
import {
  getDefaultLiveDocroot,
  getProjectRoot,
  getPublicDevRoot,
  isValidSlug,
  type ProjectMeta,
} from '@/src/lib/projects';
import type { DeployFileChange, DeployOverrides, DeployPlan, DeployResult } from '@/src/lib/types';

/**
 * Deployer: copies a project's static files to a docroot.
 * - host=local → filesystem copy to apps/public-site/ (dev simulation of public_html)
 * - host=<remote> → SSH/SFTP upload to production docroot
 */

export type DeployTargetConfig = {
  target: string;
  host: string;
  port: number;
  username: string;
  privateKeyPath: string;
  passphrase?: string;
  docroot: string;
  local: boolean;
};

const DEFAULT_IGNORES = ['.git', 'node_modules', '.DS_Store', '.project.json', '.deploy-ignore'];

function expandHome(p: string): string {
  if (p.startsWith('~/') || p === '~') return path.join(os.homedir(), p.slice(1));
  return p;
}

function resolveDocroot(overrides?: DeployOverrides): string {
  const raw = overrides?.docroot?.trim() || process.env.DEPLOY_LIVE_DOCROOT?.trim();
  if (raw) return path.resolve(expandHome(raw));
  return getDefaultLiveDocroot();
}

export function getDeployConfig(target = 'live', overrides?: DeployOverrides): DeployTargetConfig {
  if (target !== 'live') {
    throw new Error(`Unknown deploy target "${target}". Only "live" is configured.`);
  }

  const hostRaw = overrides?.host?.trim() || process.env.DEPLOY_LIVE_HOST?.trim() || 'local';
  const docroot = resolveDocroot(overrides);

  if (hostRaw === 'local') {
    return {
      target,
      host: 'local',
      port: 0,
      username: '',
      privateKeyPath: '',
      docroot,
      local: true,
    };
  }

  const username = overrides?.user?.trim() || process.env.DEPLOY_LIVE_USER?.trim() || '';
  const keyPath = overrides?.sshKeyPath?.trim() || process.env.DEPLOY_LIVE_SSH_KEY?.trim() || '~/.ssh/id_ed25519';
  const missing: string[] = [];
  if (!username) missing.push('user (DEPLOY_LIVE_USER)');
  if (missing.length) {
    throw new Error(
      `Remote deploy is not configured. Missing: ${missing.join(', ')}. Use host "local" for filesystem deploy to apps/public-site/, or set SSH credentials.`,
    );
  }

  return {
    target,
    host: hostRaw,
    port: overrides?.port || Number(process.env.DEPLOY_LIVE_PORT || 22),
    username,
    privateKeyPath: expandHome(keyPath),
    passphrase: process.env.DEPLOY_LIVE_SSH_PASSPHRASE?.trim() || undefined,
    docroot,
    local: false,
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

function deployMetaDir(): string {
  return path.join(getPublicDevRoot(), '.deploy');
}

function backupDir(slug: string, stamp: string): string {
  return path.join(deployMetaDir(), 'backups', slug, stamp);
}

async function copyDirRecursive(source: string, target: string): Promise<number> {
  await fs.mkdir(target, { recursive: true });
  let count = 0;
  const entries = await fs.readdir(source, { withFileTypes: true });
  for (const entry of entries) {
    const from = path.join(source, entry.name);
    const to = path.join(target, entry.name);
    if (entry.isDirectory()) {
      count += await copyDirRecursive(from, to);
    } else if (entry.isFile()) {
      await fs.copyFile(from, to);
      count += 1;
    }
  }
  return count;
}

async function backupLocal(docroot: string, slug: string): Promise<string> {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const local = backupDir(slug, stamp);
  if (existsSync(docroot)) {
    await copyDirRecursive(docroot, local);
  } else {
    await fs.mkdir(local, { recursive: true });
  }
  return local;
}

async function deployLocal(plan: DeployPlan, projectRoot: string, docroot: string): Promise<{ uploaded: number; bytes: number }> {
  await fs.mkdir(docroot, { recursive: true });
  let uploaded = 0;
  let bytes = 0;
  for (const change of plan.files) {
    if (change.action === 'create-dir') {
      await fs.mkdir(path.join(docroot, change.path.replace(/\/$/, '')), { recursive: true });
    }
  }
  for (const change of plan.files) {
    if (change.action === 'upload') {
      const dest = path.join(docroot, change.path);
      await fs.mkdir(path.dirname(dest), { recursive: true });
      await fs.copyFile(path.join(projectRoot, change.path), dest);
      uploaded += 1;
      bytes += change.size ?? 0;
    }
  }
  return { uploaded, bytes };
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

export async function testConnection(
  target = 'live',
  overrides?: DeployOverrides,
): Promise<{ ok: boolean; docrootExists: boolean; host: string; docroot: string }> {
  const config = getDeployConfig(target, overrides);
  if (config.local) {
    const exists = existsSync(config.docroot);
    return {
      ok: true,
      docrootExists: exists,
      host: 'local',
      docroot: config.docroot,
    };
  }
  const sftp = await connect(config);
  try {
    const type = await sftp.exists(config.docroot);
    return { ok: true, docrootExists: type === 'd', host: config.host, docroot: config.docroot };
  } finally {
    await sftp.end();
  }
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

  let backupPath: string | undefined;
  let uploaded = 0;
  let bytes = 0;

  if (config.local) {
    if (options.backup) {
      backupPath = await backupLocal(config.docroot, slug);
    }
    const result = await deployLocal(plan, root, config.docroot);
    uploaded = result.uploaded;
    bytes = result.bytes;
  } else {
    const sftp = await connect(config);
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
  return path.join(deployMetaDir(), 'audit.log');
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
  const dir = path.join(deployMetaDir(), 'backups', slug);
  if (!existsSync(dir)) return [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  return entries
    .filter((e) => e.isDirectory())
    .map((e) => ({ stamp: e.name, path: path.join(dir, e.name) }))
    .sort((a, b) => b.stamp.localeCompare(a.stamp));
}

export async function rollback(
  slug: string,
  target: string,
  stamp: string,
  overrides?: DeployOverrides,
): Promise<DeployResult> {
  const startedAt = new Date().toISOString();
  const config = getDeployConfig(target, overrides);
  const local = path.join(deployMetaDir(), 'backups', slug, stamp);
  if (!existsSync(local)) throw new Error(`Backup not found: ${stamp}`);

  let uploaded = 0;
  if (config.local) {
    await fs.mkdir(config.docroot, { recursive: true });
    uploaded = await copyDirRecursive(local, config.docroot);
  } else {
    const sftp = await connect(config);
    try {
      await sftp.mkdir(config.docroot, true).catch(() => {});
      uploaded = await uploadDirCount(sftp, local, config.docroot);
    } finally {
      await sftp.end();
    }
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
