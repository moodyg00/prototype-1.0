import 'server-only';
import { spawnPureBrowser } from '@/lib/browser/pure-browser-engine';
import type { ChildProcess } from 'child_process';

interface State {
  running: boolean;
  lines: string[];
  process: ChildProcess | null;
}

const s: State = { running: false, lines: [], process: null };

export function getBrowserState() {
  return s;
}

export function startBrowserTask(task: string, url: string) {
  if (s.running && s.process) {
    s.process.kill('SIGTERM');
    s.process = null;
    s.running = false;
  }
  s.lines = [];
  s.running = true;
  const { process: proc } = spawnPureBrowser(task, url, (line) => s.lines.push(line));
  s.process = proc;
  proc.on('close', (code: number | null) => {
    s.running = false;
    s.process = null;
    s.lines.push('[done] exit ' + (code ?? 0));
  });
  proc.on('error', (err: Error) => {
    s.running = false;
    s.process = null;
    s.lines.push('[error] ' + err.message);
  });
}

export function stopBrowserTask() {
  if (s.process) {
    s.process.kill('SIGTERM');
    s.process = null;
  }
  s.running = false;
  s.lines.push('[done] stopped');
}
