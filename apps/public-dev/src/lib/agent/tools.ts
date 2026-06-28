import { tool } from 'ai';
import { z } from 'zod';
import {
  createFile,
  deleteFile,
  listFiles,
  readFile,
  writeFile,
  type FileNode,
} from '@/src/lib/projects';

export type ToolEvent = { tool: string; summary: string };

export type AgentToolState = {
  filesChanged: boolean;
  requestDeploy: boolean;
  deployReason?: string;
  events: ToolEvent[];
};

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

/**
 * Build the agent's toolset, hard-scoped to a single project `slug`. The agent
 * is structurally incapable of touching another project: the slug is bound here
 * and every path flows through the project path-scoping in `projects.ts`.
 */
export function buildProjectTools(slug: string, state: AgentToolState) {
  return {
    list_files: tool({
      description: 'List all files and folders in the current project.',
      inputSchema: z.object({}),
      execute: async () => {
        const tree = await listFiles(slug);
        const paths = flatten(tree);
        state.events.push({ tool: 'list_files', summary: `${paths.length} entries` });
        return { paths };
      },
    }),

    read_file: tool({
      description: 'Read the UTF-8 text contents of a file in the current project.',
      inputSchema: z.object({ path: z.string().describe('Project-relative path, e.g. index.html') }),
      execute: async ({ path }) => {
        try {
          const content = await readFile(slug, path);
          state.events.push({ tool: 'read_file', summary: path });
          return { path, content };
        } catch (err) {
          return { error: (err as Error).message };
        }
      },
    }),

    write_file: tool({
      description:
        'Create or overwrite a file with the given UTF-8 text content. Use only plain HTML/CSS/JS — no build steps or frameworks.',
      inputSchema: z.object({
        path: z.string().describe('Project-relative path, e.g. css/styles.css'),
        content: z.string(),
      }),
      execute: async ({ path, content }) => {
        try {
          await writeFile(slug, path, content);
          state.filesChanged = true;
          state.events.push({ tool: 'write_file', summary: `${path} (${content.length} chars)` });
          return { ok: true, path };
        } catch (err) {
          return { error: (err as Error).message };
        }
      },
    }),

    create_path: tool({
      description: 'Create an empty file or a folder in the current project.',
      inputSchema: z.object({
        path: z.string(),
        kind: z.enum(['file', 'dir']).default('file'),
      }),
      execute: async ({ path, kind }) => {
        try {
          await createFile(slug, path, kind);
          state.filesChanged = true;
          state.events.push({ tool: 'create_path', summary: `${kind}: ${path}` });
          return { ok: true, path };
        } catch (err) {
          return { error: (err as Error).message };
        }
      },
    }),

    delete_file: tool({
      description: 'Delete a file or folder in the current project. Irreversible.',
      inputSchema: z.object({ path: z.string() }),
      execute: async ({ path }) => {
        try {
          await deleteFile(slug, path);
          state.filesChanged = true;
          state.events.push({ tool: 'delete_file', summary: path });
          return { ok: true, path };
        } catch (err) {
          return { error: (err as Error).message };
        }
      },
    }),

    request_deploy: tool({
      description:
        'Request a deploy to the live site. This does NOT deploy — it opens the deploy confirmation dialog for the human. Only call this if the human has said the site is tested and stable.',
      inputSchema: z.object({
        reason: z.string().describe('Why a deploy is appropriate now.'),
      }),
      execute: async ({ reason }) => {
        state.requestDeploy = true;
        state.deployReason = reason;
        state.events.push({ tool: 'request_deploy', summary: 'opened deploy dialog for confirmation' });
        return {
          ok: true,
          note: 'Deploy dialog opened. The human must review the dry-run and confirm. No deploy has occurred.',
        };
      },
    }),
  };
}

export const AGENT_SYSTEM_PROMPT = (slug: string) =>
  `You are a focused web developer agent working ONLY inside the static site project "${slug}".

Hard rules:
- You may only read, write, create, and delete files within this one project via the provided tools. You cannot access any other project, any path outside it, or the deploy host's filesystem.
- Build PLAIN static websites: hand-written HTML, CSS, and vanilla JS only. No frameworks, bundlers, build steps, package managers, server code, or external runtime dependencies.
- Keep changes minimal and correct. Read a file before editing it. Preserve existing structure and style unless asked otherwise.
- NEVER deploy on your own. Deploying is a human action behind an explicit confirmation dialog. Only call request_deploy if the human has clearly stated the site is "tested and stable" and asked to deploy; even then it just opens the dialog for them to confirm.
- After editing, briefly tell the human what changed and suggest they check the live preview.

Be concise and practical.`;
