import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

import { readFile, resolveInProject, writeFile } from './project-fs';
import { contentHashMatches, formatContentHash } from './content-hash';

export { formatContentHash, contentFingerprint, contentHashMatches } from './content-hash';
export type { ValidateIssue, ValidateProjectResult } from './validate-project';
export { validateProject, cssBraceBalance } from './validate-project';

export const AGENT_DIR = '.agent';
export const SCRATCH_DIR = '.agent/scratch';
export const CHECKPOINT_DIR = '.agent/checkpoints';
export const SESSIONS_DIR = '.agent/sessions';

/** Ensure agent-internal folders exist (scratch, checkpoints, sessions). */
export async function ensureAgentDirs(slug: string): Promise<void> {
  for (const rel of [AGENT_DIR, SCRATCH_DIR, CHECKPOINT_DIR, SESSIONS_DIR]) {
    const abs = resolveInProject(slug, rel);
    await fs.mkdir(abs, { recursive: true });
  }
}

function checkpointAbs(slug: string, relPath: string, runId: string): string {
  const safeRun = runId.replace(/[^a-zA-Z0-9_-]/g, '_');
  const safePath = relPath.replace(/\\/g, '/');
  return resolveInProject(slug, `${CHECKPOINT_DIR}/${safeRun}/${safePath}`);
}

/**
 * Snapshot a file before the agent edits it. Skips if already checkpointed for this run.
 * Returns true when a new checkpoint was written.
 */
export async function saveCheckpoint(
  slug: string,
  runId: string,
  relPath: string,
  content?: string,
): Promise<boolean> {
  await ensureAgentDirs(slug);
  const dest = checkpointAbs(slug, relPath, runId);
  if (existsSync(dest)) return false;
  const body = content ?? (await readFile(slug, relPath));
  await fs.mkdir(path.dirname(dest), { recursive: true });
  await fs.writeFile(dest, body, 'utf8');
  return true;
}

/** Restore a file from a run checkpoint. Defaults to the latest run id under checkpoints. */
export async function restoreCheckpoint(
  slug: string,
  relPath: string,
  runId?: string,
): Promise<{ restored: boolean; runId: string }> {
  await ensureAgentDirs(slug);
  const root = resolveInProject(slug, CHECKPOINT_DIR);
  let targetRun = runId;
  if (!targetRun) {
    const runs = await fs.readdir(root).catch(() => [] as string[]);
    const sorted = runs.filter((r) => r !== 'latest').sort();
    targetRun = sorted[sorted.length - 1];
  }
  if (!targetRun) throw new Error('No checkpoints found for this project.');
  const src = checkpointAbs(slug, relPath, targetRun);
  if (!existsSync(src)) throw new Error(`No checkpoint for ${relPath} in run ${targetRun}.`);
  const body = await fs.readFile(src, 'utf8');
  await writeFile(slug, relPath, body);
  return { restored: true, runId: targetRun };
}

/** Surgical search-and-replace with optional stale-state hash guard. */
export async function patchFile(
  slug: string,
  relPath: string,
  oldString: string,
  newString: string,
  replaceAll = false,
  expectHash?: string,
): Promise<{ replacements: number; contentHash: string }> {
  if (!oldString) throw new Error('old_string must not be empty.');
  const content = await readFile(slug, relPath);
  if (expectHash?.trim() && !contentHashMatches(content, expectHash)) {
    throw new Error(
      `Stale file ${relPath}: content hash mismatch (expected ${expectHash.trim()}, got ${formatContentHash(content)}). ` +
        'Re-read the file and copy a fresh old_string + expect_hash from read_file.',
    );
  }
  if (!content.includes(oldString)) {
    throw new Error(`old_string not found in ${relPath}. Re-read the file and copy an exact snippet.`);
  }
  const parts = content.split(oldString);
  const occurrences = parts.length - 1;
  if (!replaceAll && occurrences > 1) {
    throw new Error(
      `old_string matches ${occurrences} times in ${relPath}. Include more surrounding context for a unique match, or set replace_all=true.`,
    );
  }
  const next = replaceAll ? content.split(oldString).join(newString) : content.replace(oldString, newString);
  await writeFile(slug, relPath, next);
  return { replacements: replaceAll ? occurrences : 1, contentHash: formatContentHash(next) };
}
