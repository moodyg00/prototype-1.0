import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const requireMod = createRequire(import.meta.url);

function debugLog(message, data) {
  const payload = {
    sessionId: '59fcd2',
    hypothesisId: 'I',
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
    if (existsSync(path.join(dir, 'server.js')) && existsSync(path.join(dir, 'standalone'))) {
      return dir;
    }
  }
  return null;
}

export function bootHostingerApp(app) {
  const fromDir = path.dirname(fileURLToPath(import.meta.url));
  process.env.PORT = process.env.PORT ?? '3000';
  process.env.HOSTNAME = process.env.HOSTNAME ?? '0.0.0.0';

  const nextDir = findNextDir(fromDir, app);
  debugLog('bootHostingerApp', { app, fromDir, nextDir, cwd: process.cwd(), port: process.env.PORT });

  if (!nextDir) {
    console.error(`[hostinger-boot] no .next output for ${app} (from ${fromDir})`);
    process.exit(1);
  }

  debugLog('requiring server.js', { serverJs: path.join(nextDir, 'server.js') });
  requireMod(path.join(nextDir, 'server.js'));
}
