/**
 * Shared types for project file access and the IDE agent toolset. These mirror
 * the public-dev IDE's project model so the same path-scoped filesystem layer
 * can be reused by both the IDE UI and the agent workflow runtime.
 */

/**
 * Optional per-project deploy overrides. Anything left blank falls back to the
 * target's environment config. Secrets (passphrase) are intentionally NOT
 * storable per project — keep those in env only.
 */
export type DeployOverrides = {
  host?: string;
  port?: number;
  user?: string;
  sshKeyPath?: string;
  docroot?: string;
};

export type ProjectMeta = {
  slug: string;
  name: string;
  description?: string;
  target: string;
  deploy?: DeployOverrides;
  createdAt: string;
  updatedAt: string;
};

export type FileNode = {
  name: string;
  path: string;
  type: 'file' | 'dir';
  children?: FileNode[];
};

/** A single tool invocation summary, surfaced to the IDE chat UI. */
export type ToolEvent = { tool: string; summary: string };

/** One reasoning step from xAI Grok, surfaced in chat and ingested to memory. */
export type ThoughtStep = {
  step: number;
  reasoning?: string;
  tool?: string;
  summary?: string;
};

/**
 * Mutable side-effect record threaded through an IDE agent run. Tools update it
 * as they execute so the run adapter can report what happened back to the UI.
 */
export type IdeSideEffects = {
  filesChanged: boolean;
  requestDeploy: boolean;
  deployReason?: string;
  events: ToolEvent[];
  thoughts?: ThoughtStep[];
  /** Last read_file content per path — used to catch accidental full-file wipes. */
  readCache?: Record<string, string>;
  /** Per-run id for checkpoints and memory ingest. */
  runId?: string;
  /** Paths checkpointed this run (avoid duplicate snapshots). */
  checkpointedPaths?: string[];
};

/** Per-run context every IDE tool needs: the project it is hard-scoped to. */
export type IdeToolContext = {
  slug: string;
  effects: IdeSideEffects;
};

export function createIdeSideEffects(): IdeSideEffects {
  return { filesChanged: false, requestDeploy: false, events: [] };
}
