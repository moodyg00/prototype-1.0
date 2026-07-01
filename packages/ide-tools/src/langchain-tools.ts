import { existsSync } from 'node:fs';
import { tool } from '@langchain/core/tools';
import type { StructuredToolInterface } from '@langchain/core/tools';
import { z } from 'zod';

import {
  patchFile,
  restoreCheckpoint,
  saveCheckpoint,
  formatContentHash,
  ensureAgentDirs,
  SCRATCH_DIR,
} from './checkpoints';
import { validateProject } from './validate-project';
import {
  createFile,
  deleteFile,
  duplicateFile,
  listFiles,
  moveEntry,
  readFile,
  resolveInProject,
  writeFile,
} from './project-fs';
import type { FileNode, IdeToolContext } from './types';

/**
 * LangChain tools for the IDE agent, hard-scoped to a single project via the
 * bound {@link IdeToolContext}. The agent is structurally incapable of touching
 * another project: the slug is bound here and every path flows through the
 * project path-scoping in `project-fs.ts`. Each tool records a short summary on
 * `ctx.effects.events` and flips `filesChanged` / `requestDeploy` as needed.
 */

function flatten(nodes: FileNode[], acc: string[] = []): string[] {
  for (const n of nodes) {
    if (n.type === 'dir') {
      acc.push(`${n.path}/`);
      if (n.children) flatten(n.children, acc);
    } else {
      acc.push(n.path);
    }
  }
  return acc;
}

function isScratchPath(relPath: string): boolean {
  return relPath.replace(/\\/g, '/').startsWith('.agent/');
}

async function maybeCheckpoint(ctx: IdeToolContext, relPath: string): Promise<void> {
  if (isScratchPath(relPath)) return;
  const runId = ctx.effects.runId;
  if (!runId) return;
  if (ctx.effects.checkpointedPaths?.includes(relPath)) return;
  const abs = resolveInProject(ctx.slug, relPath);
  if (!existsSync(abs)) return;
  await saveCheckpoint(ctx.slug, runId, relPath);
  if (!ctx.effects.checkpointedPaths) ctx.effects.checkpointedPaths = [];
  ctx.effects.checkpointedPaths.push(relPath);
}

/** The short name of each IDE tool, used as the LangChain tool name. */
function planPath(): string {
  return `${SCRATCH_DIR}/plan.md`;
}

function planExists(slug: string): boolean {
  return existsSync(resolveInProject(slug, planPath()));
}

export type IdeToolName =
  | 'list_files'
  | 'read_file'
  | 'patch_file'
  | 'write_file'
  | 'write_plan'
  | 'validate_project'
  | 'create_path'
  | 'delete_file'
  | 'move_file'
  | 'copy_file'
  | 'revert_checkpoint'
  | 'request_deploy';

type ToolBuilder = (ctx: IdeToolContext) => StructuredToolInterface;

const builders: Record<IdeToolName, ToolBuilder> = {
  list_files: (ctx) =>
    tool(
      async () => {
        const tree = await listFiles(ctx.slug);
        const paths = flatten(tree);
        ctx.effects.events.push({ tool: 'list_files', summary: `${paths.length} entries` });
        return JSON.stringify({
          paths,
          note: 'Agent scratch lives at .agent/scratch/ (hidden from this tree; use known paths).',
        });
      },
      {
        name: 'list_files',
        description: 'List all files and folders in the current project (excludes .agent internals).',
        schema: z.object({}),
      },
    ),

  read_file: (ctx) =>
    tool(
      async ({ path }: { path: string }) => {
        try {
          const content = await readFile(ctx.slug, path);
          if (!ctx.effects.readCache) ctx.effects.readCache = {};
          ctx.effects.readCache[path] = content;
          ctx.effects.events.push({ tool: 'read_file', summary: path });
          return JSON.stringify({
            path,
            content,
            contentHash: formatContentHash(content),
          });
        } catch (err) {
          return JSON.stringify({ error: (err as Error).message });
        }
      },
      {
        name: 'read_file',
        description:
          'Read the UTF-8 text contents of a file in the current project. Returns contentHash — pass it as expect_hash on the next patch_file for stale-state protection.',
        schema: z.object({
          path: z.string().describe('Project-relative path, e.g. index.html or .agent/scratch/plan.md'),
        }),
      },
    ),

  patch_file: (ctx) =>
    tool(
      async ({
        path,
        old_string,
        new_string,
        replace_all,
        expect_hash,
      }: {
        path: string;
        old_string: string;
        new_string: string;
        replace_all?: boolean;
        expect_hash?: string;
      }) => {
        try {
          await maybeCheckpoint(ctx, path);
          const { replacements, contentHash } = await patchFile(
            ctx.slug,
            path,
            old_string,
            new_string,
            Boolean(replace_all),
            expect_hash,
          );
          const updated = await readFile(ctx.slug, path);
          if (!ctx.effects.readCache) ctx.effects.readCache = {};
          ctx.effects.readCache[path] = updated;
          ctx.effects.filesChanged = true;
          ctx.effects.events.push({
            tool: 'patch_file',
            summary: `${path} (${replacements} replacement${replacements === 1 ? '' : 's'})`,
          });
          const result: Record<string, unknown> = { ok: true, path, replacements, contentHash };
          if (!isScratchPath(path) && !planExists(ctx.slug) && !ctx.effects.planWritten) {
            result.hint =
              'No .agent/scratch/plan.md yet — use write_plan before multi-step production edits.';
          }
          return JSON.stringify(result);
        } catch (err) {
          return JSON.stringify({ error: (err as Error).message });
        }
      },
      {
        name: 'patch_file',
        description:
          'Surgical edit: replace old_string with new_string. Pass expect_hash from read_file to fail fast if the file changed. Preferred for all edits to existing HTML/CSS/JS.',
        schema: z.object({
          path: z.string().describe('Project-relative path, e.g. css/public-home-variant.css'),
          old_string: z.string().describe('Exact text to find (unique unless replace_all)'),
          new_string: z.string().describe('Replacement text'),
          replace_all: z.boolean().optional().describe('Replace every occurrence (default false)'),
          expect_hash: z
            .string()
            .optional()
            .describe('contentHash from read_file — rejects patch if file changed since read'),
        }),
      },
    ),

  write_plan: (ctx) =>
    tool(
      async ({ content, append }: { content: string; append?: boolean }) => {
        try {
          await ensureAgentDirs(ctx.slug);
          const rel = planPath();
          let body = content.trim();
          if (append) {
            try {
              const prior = await readFile(ctx.slug, rel);
              body = prior.trimEnd() + '\n\n' + body;
            } catch {
              /* new plan */
            }
          }
          if (!body) return JSON.stringify({ error: 'Plan content must not be empty.' });
          await writeFile(ctx.slug, rel, body + '\n');
          ctx.effects.planWritten = true;
          ctx.effects.events.push({ tool: 'write_plan', summary: rel });
          return JSON.stringify({ ok: true, path: rel, chars: body.length });
        } catch (err) {
          return JSON.stringify({ error: (err as Error).message });
        }
      },
      {
        name: 'write_plan',
        description:
          'Write or append the edit plan at .agent/scratch/plan.md before touching production files (multi-file or non-trivial tasks).',
        schema: z.object({
          content: z.string().describe('Markdown plan: files, selectors, property changes'),
          append: z.boolean().optional().describe('Append to existing plan instead of replacing'),
        }),
      },
    ),

  validate_project: (ctx) =>
    tool(
      async ({ paths }: { paths?: string[] }) => {
        try {
          const report = await validateProject(ctx.slug);
          let issues = report.issues;
          if (paths?.length) {
            const wanted = new Set(paths.map((p) => p.replace(/\\/g, '/')));
            issues = issues.filter((i) => wanted.has(i.file));
          }
          const filtered = {
            ...report,
            issues,
            errorCount: issues.filter((i) => i.severity === 'error').length,
            warningCount: issues.filter((i) => i.severity === 'warning').length,
            ok: issues.every((i) => i.severity !== 'error'),
          };
          ctx.effects.events.push({
            tool: 'validate_project',
            summary: filtered.ok
              ? `${filtered.checkedHtml} html, ${filtered.checkedCss} css — ok`
              : `${filtered.errorCount} error(s), ${filtered.warningCount} warning(s)`,
          });
          return JSON.stringify(filtered);
        } catch (err) {
          return JSON.stringify({ error: (err as Error).message });
        }
      },
      {
        name: 'validate_project',
        description:
          'Run post-edit checks: broken relative links in HTML, missing @imports, empty files, CSS brace balance. Call after production edits.',
        schema: z.object({
          paths: z
            .array(z.string())
            .optional()
            .describe('Optional subset of files to filter reported issues'),
        }),
      },
    ),

  write_file: (ctx) =>
    tool(
      async ({ path, content }: { path: string; content: string }) => {
        try {
          const abs = resolveInProject(ctx.slug, path);
          const exists = existsSync(abs);
          if (exists && !isScratchPath(path)) {
            return JSON.stringify({
              error:
                `Refusing write_file on existing production file ${path}. Use patch_file for surgical edits, or revert_checkpoint to undo.`,
            });
          }
          const prior = ctx.effects.readCache?.[path];
          if (prior && prior.length > 300 && content.length < prior.length * 0.5) {
            return JSON.stringify({
              error:
                `Refusing write: new content (${content.length} chars) is much shorter than the file you read (${prior.length} chars). ` +
                'Use patch_file for partial edits.',
            });
          }
          if (exists) await maybeCheckpoint(ctx, path);
          await writeFile(ctx.slug, path, content);
          ctx.effects.filesChanged = true;
          ctx.effects.events.push({
            tool: 'write_file',
            summary: `${path} (${content.length} chars)`,
          });
          return JSON.stringify({ ok: true, path });
        } catch (err) {
          return JSON.stringify({ error: (err as Error).message });
        }
      },
      {
        name: 'write_file',
        description:
          'Create a NEW file or write scratch notes under .agent/scratch/. Do NOT use on existing production HTML/CSS/JS — use patch_file instead.',
        schema: z.object({
          path: z.string().describe('Project-relative path, e.g. .agent/scratch/plan.md'),
          content: z.string(),
        }),
      },
    ),

  revert_checkpoint: (ctx) =>
    tool(
      async ({ path, run_id }: { path: string; run_id?: string }) => {
        try {
          const { restored, runId } = await restoreCheckpoint(ctx.slug, path, run_id);
          const content = await readFile(ctx.slug, path);
          if (!ctx.effects.readCache) ctx.effects.readCache = {};
          ctx.effects.readCache[path] = content;
          ctx.effects.filesChanged = true;
          ctx.effects.events.push({
            tool: 'revert_checkpoint',
            summary: `${path} ← checkpoint ${runId}`,
          });
          return JSON.stringify({ ok: restored, path, runId });
        } catch (err) {
          return JSON.stringify({ error: (err as Error).message });
        }
      },
      {
        name: 'revert_checkpoint',
        description:
          'Restore a file from the automatic pre-edit checkpoint (latest run if run_id omitted). Use when the human asks to undo your last edit.',
        schema: z.object({
          path: z.string().describe('Project-relative path to restore'),
          run_id: z.string().optional().describe('Checkpoint run id (omit for latest)'),
        }),
      },
    ),

  create_path: (ctx) =>
    tool(
      async ({ path, kind }: { path: string; kind?: 'file' | 'dir' }) => {
        try {
          await createFile(ctx.slug, path, kind ?? 'file');
          ctx.effects.filesChanged = true;
          ctx.effects.events.push({ tool: 'create_path', summary: `${kind ?? 'file'}: ${path}` });
          return JSON.stringify({ ok: true, path });
        } catch (err) {
          return JSON.stringify({ error: (err as Error).message });
        }
      },
      {
        name: 'create_path',
        description: 'Create an empty file or a folder in the current project.',
        schema: z.object({
          path: z.string(),
          kind: z.enum(['file', 'dir']).default('file'),
        }),
      },
    ),

  delete_file: (ctx) =>
    tool(
      async ({ path }: { path: string }) => {
        try {
          await deleteFile(ctx.slug, path);
          ctx.effects.filesChanged = true;
          ctx.effects.events.push({ tool: 'delete_file', summary: path });
          return JSON.stringify({ ok: true, path });
        } catch (err) {
          return JSON.stringify({ error: (err as Error).message });
        }
      },
      {
        name: 'delete_file',
        description: 'Delete a file or folder in the current project. Irreversible.',
        schema: z.object({ path: z.string() }),
      },
    ),

  move_file: (ctx) =>
    tool(
      async ({ from, to }: { from: string; to: string }) => {
        try {
          await moveEntry(ctx.slug, from, to);
          ctx.effects.filesChanged = true;
          ctx.effects.events.push({ tool: 'move_file', summary: `${from} → ${to}` });
          return JSON.stringify({ ok: true, from, to });
        } catch (err) {
          return JSON.stringify({ error: (err as Error).message });
        }
      },
      {
        name: 'move_file',
        description: 'Move or rename a file or folder within the current project.',
        schema: z.object({
          from: z.string().describe('Existing project-relative path'),
          to: z.string().describe('New project-relative path'),
        }),
      },
    ),

  copy_file: (ctx) =>
    tool(
      async ({ path }: { path: string }) => {
        try {
          const dest = await duplicateFile(ctx.slug, path);
          ctx.effects.filesChanged = true;
          ctx.effects.events.push({ tool: 'copy_file', summary: `${path} → ${dest}` });
          return JSON.stringify({ ok: true, path, dest });
        } catch (err) {
          return JSON.stringify({ error: (err as Error).message });
        }
      },
      {
        name: 'copy_file',
        description: 'Duplicate a file in the current project; returns the new path.',
        schema: z.object({ path: z.string().describe('Project-relative file path to duplicate') }),
      },
    ),

  request_deploy: (ctx) =>
    tool(
      async ({ reason }: { reason: string }) => {
        ctx.effects.requestDeploy = true;
        ctx.effects.deployReason = reason;
        ctx.effects.events.push({
          tool: 'request_deploy',
          summary: 'opened deploy dialog for confirmation',
        });
        return JSON.stringify({
          ok: true,
          note: 'Deploy dialog opened. The human must review the dry-run and confirm. No deploy has occurred.',
        });
      },
      {
        name: 'request_deploy',
        description:
          'Request a deploy to the live site. This does NOT deploy — it opens the deploy confirmation dialog for the human. Only call this if the human has said the site is tested and stable.',
        schema: z.object({
          reason: z.string().describe('Why a deploy is appropriate now.'),
        }),
      },
    ),
};

export const IDE_TOOL_NAMES = Object.keys(builders) as IdeToolName[];

/**
 * Build the IDE LangChain toolset for a run. Pass `names` to restrict to a
 * subset (e.g. only the tool nodes wired into the agent in the visual graph);
 * omit it to build every tool. Unknown names are ignored.
 */
export function buildIdeLangChainTools(
  ctx: IdeToolContext,
  names?: IdeToolName[],
): StructuredToolInterface[] {
  const selected = names && names.length > 0 ? names : IDE_TOOL_NAMES;
  return selected.filter((n) => builders[n]).map((n) => builders[n](ctx));
}
