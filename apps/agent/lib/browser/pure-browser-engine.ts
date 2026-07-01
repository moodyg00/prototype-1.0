import 'server-only';
import { spawn, type ChildProcess } from 'child_process';

/**
 * Canonical browser execution engine for the unified "Browser" tool.
 *
 * Shells out to the `agent-browser` CLI (fast CDP / accessibility-tree driven,
 * no vision/model cost per step). This is used both by the standalone Browser
 * panel (fire-and-forget + polling, see app/api/browser/*) and by the
 * `tool.browser` LangGraph node (lib/workflow/runtime.ts), so there is exactly
 * one execution path behind the tool regardless of whether it's invoked
 * interactively or from a workflow.
 */

export interface PureBrowserHandle {
  process: ChildProcess;
}

export function spawnPureBrowser(
  task: string,
  url: string | undefined,
  onLine: (line: string) => void,
): PureBrowserHandle {
  const args = ['run', '--task', task];
  if (url) args.push('--url', url);
  const proc = spawn('agent-browser', args, { env: process.env });

  proc.stdout?.on('data', (d) => {
    d.toString().split('\n').filter(Boolean).forEach((l: string) => onLine(l));
  });
  proc.stderr?.on('data', (d) => {
    d.toString().split('\n').filter(Boolean).forEach((l: string) => onLine('[err] ' + l));
  });

  return { process: proc };
}

export interface PureBrowserRunResult {
  lines: string[];
  exitCode: number | null;
  finalAnswer: string | null;
}

/** Runs a task to completion and resolves once the process exits. Used by the LangGraph tool node. */
export function runPureBrowserTask(task: string, url?: string): Promise<PureBrowserRunResult> {
  return new Promise((resolve) => {
    const lines: string[] = [];
    const { process: proc } = spawnPureBrowser(task, url, (line) => lines.push(line));

    proc.on('close', (code) => {
      const lastMeaningful = [...lines].reverse().find((l) => !l.startsWith('[err]')) ?? null;
      resolve({ lines, exitCode: code, finalAnswer: lastMeaningful });
    });
    proc.on('error', (err: Error) => {
      lines.push('[error] ' + err.message);
      resolve({ lines, exitCode: null, finalAnswer: null });
    });
  });
}
