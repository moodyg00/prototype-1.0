import 'server-only';
import { spawn, ChildProcess } from 'child_process';

interface State {
  running: boolean;
  lines: string[];
  process: ChildProcess | null;
}

const s: State = { running: false, lines: [], process: null };

export function getPureBrowserState() { return s; }

export function startPureBrowser(task: string, url: string) {
  if (s.running && s.process) {
    s.process.kill('SIGTERM');
    s.process = null;
    s.running = false;
  }
  s.lines = [];
  s.running = true;
  const args = ["run", "--task", task];
  if (url) args.push("--url", url);
  const proc = spawn("agent-browser", args, { env: process.env });
  s.process = proc;
  proc.stdout?.on("data", (d) => {
    const txt = d.toString();
    txt.split("\n").filter(Boolean).forEach((l: string) => s.lines.push(l));
  });
  proc.stderr?.on("data", (d) => {
    const txt = d.toString();
    txt.split("\n").filter(Boolean).forEach((l: string) => s.lines.push("[err] " + l));
  });
  proc.on("close", (code: number | null) => {
    s.running = false;
    s.process = null;
    s.lines.push("[done] exit " + (code ?? 0));
  });
  proc.on("error", (err: Error) => {
    s.running = false;
    s.process = null;
    s.lines.push("[error] " + err.message);
  });
}

export function stopPureBrowser() {
  if (s.process) {
    s.process.kill('SIGTERM');
    s.process = null;
  }
  s.running = false;
  s.lines.push('[done] stopped');
}
