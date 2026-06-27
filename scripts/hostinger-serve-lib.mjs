import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function debugLog(hypothesisId, message, data) {
  const payload = {
    sessionId: '59fcd2',
    hypothesisId,
    location: 'hostinger-serve-lib.mjs',
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

function resolveServerPath(app) {
  const appDir = path.join(root, 'apps', app);
  const nextDir = path.join(appDir, '.next');
  const metaPath = path.join(nextDir, 'hostinger-server.json');

  if (existsSync(metaPath)) {
    const meta = JSON.parse(readFileSync(metaPath, 'utf8'));
    if (meta.serverPath && existsSync(meta.serverPath)) {
      return { serverPath: meta.serverPath, source: 'hostinger-server.json' };
    }
  }

  const standaloneCandidates = [
    path.join(nextDir, 'standalone/apps', app, 'server.js'),
    path.join(nextDir, 'standalone/server.js'),
  ];

  for (const serverPath of standaloneCandidates) {
    if (existsSync(serverPath)) {
      return { serverPath, source: 'standalone-candidate' };
    }
  }

  return { serverPath: null, source: 'not-found' };
}

export function startHostingerApp(app) {
  const appDir = path.join(root, 'apps', app);
  const port = process.env.PORT ?? '3000';
  const env = {
    ...process.env,
    PORT: port,
    HOSTNAME: '0.0.0.0',
  };

  debugLog('A', 'startHostingerApp entry', {
    app,
    port,
    cwd: process.cwd(),
    root,
    appDir,
    hasBoot: existsSync(path.join(appDir, '.next/hostinger-boot.mjs')),
  });

  const bootPath = path.join(appDir, '.next/hostinger-boot.mjs');
  if (existsSync(bootPath)) {
    debugLog('B', 'delegating to hostinger-boot.mjs', { bootPath, port });
    execFileSync(process.execPath, [bootPath], {
      cwd: path.dirname(bootPath),
      stdio: 'inherit',
      env,
    });
    return;
  }

  const { serverPath, source } = resolveServerPath(app);
  debugLog('A', 'resolved standalone server', { serverPath, source, port });

  if (serverPath) {
    execFileSync(process.execPath, [serverPath], {
      cwd: path.dirname(serverPath),
      stdio: 'inherit',
      env,
    });
    return;
  }

  debugLog('D', 'falling back to next start', { appDir, port });
  const requireFrom = createRequire(path.join(appDir, 'package.json'));
  const nextCli = requireFrom.resolve('next/dist/bin/next');
  execFileSync(process.execPath, [nextCli, 'start', '-p', port, '-H', '0.0.0.0'], {
    cwd: appDir,
    stdio: 'inherit',
    env,
  });
}
