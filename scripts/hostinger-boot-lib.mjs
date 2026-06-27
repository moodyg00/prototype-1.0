import { createRequire } from 'node:module';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const requireMod = createRequire(import.meta.url);

function debugLog(message, data) {
  const payload = {
    sessionId: '59fcd2',
    hypothesisId: 'H',
    location: 'hostinger-boot-lib.mjs',
    message,
    data,
    timestamp: Date.now(),
  };
  // #region agent log
  console.error(JSON.stringify(payload));
  fetch('http://127.0.0.1:7280/ingest/9429c220-9917-42ac-851a-08d1ee363182', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '59fcd2' },
    body: JSON.stringify(payload),
  }).catch(() => {});
  // #endregion
}

function findNextDir(fromDir, app) {
  const candidates = [
    path.join(fromDir, '..'),
    path.join(fromDir, '..', '..'),
    path.join(fromDir, '..', 'apps', app, '.next'),
    path.join(fromDir, '..', '..', 'apps', app, '.next'),
  ];
  for (const dir of candidates) {
    if (existsSync(path.join(dir, 'standalone'))) return dir;
  }
  return null;
}

function resolveServerPath(nextDir, app) {
  const metaPath = path.join(nextDir, 'hostinger-server.json');
  if (existsSync(metaPath)) {
    const meta = JSON.parse(readFileSync(metaPath, 'utf8'));
    if (meta.serverPath && existsSync(meta.serverPath)) return meta.serverPath;
  }
  const candidates = [
    path.join(nextDir, 'standalone/apps', app, 'server.js'),
    path.join(nextDir, 'standalone/server.js'),
  ];
  for (const serverPath of candidates) {
    if (existsSync(serverPath)) return serverPath;
  }
  return null;
}

export function bootHostingerApp(app) {
  const fromDir = path.dirname(fileURLToPath(import.meta.url));
  const port = process.env.PORT ?? '3000';
  process.env.PORT = port;
  process.env.HOSTNAME = process.env.HOSTNAME ?? '0.0.0.0';

  const nextDir = findNextDir(fromDir, app);
  debugLog('bootHostingerApp', { app, port, fromDir, nextDir, cwd: process.cwd() });

  if (!nextDir) {
    console.error(`[hostinger-boot] cannot find .next/standalone for ${app} from ${fromDir}`);
    process.exit(1);
  }

  const serverPath = resolveServerPath(nextDir, app);
  if (!serverPath) {
    console.error(`[hostinger-boot] cannot find standalone server.js for ${app} under ${nextDir}`);
    process.exit(1);
  }

  debugLog('starting standalone in-process', { serverPath, port, cwd: path.dirname(serverPath) });
  process.chdir(path.dirname(serverPath));
  requireMod(serverPath);
  setInterval(() => {}, 1 << 30);
}
