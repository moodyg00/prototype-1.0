import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function findStandaloneServer(standaloneDir, app) {
  const candidates = [
    path.join(standaloneDir, 'apps', app, 'server.js'),
    path.join(standaloneDir, 'server.js'),
  ];
  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

function writeBootScript(nextDir, app, serverPath) {
  const bootPath = path.join(nextDir, 'hostinger-boot.mjs');
  const bootSource = `import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const nextDir = path.dirname(fileURLToPath(import.meta.url));
const metaPath = path.join(nextDir, 'hostinger-server.json');
const meta = existsSync(metaPath) ? JSON.parse(readFileSync(metaPath, 'utf8')) : null;
const candidates = [
  meta?.serverPath,
  path.join(nextDir, 'standalone/apps/${app}/server.js'),
  path.join(nextDir, 'standalone/server.js'),
].filter(Boolean);
const port = process.env.PORT ?? '3000';
const env = { ...process.env, PORT: port, HOSTNAME: '0.0.0.0' };

// #region agent log
console.error(JSON.stringify({ sessionId: '59fcd2', hypothesisId: 'C', location: 'hostinger-boot.mjs', message: 'boot start', data: { nextDir, port, candidates }, timestamp: Date.now() }));
// #endregion

for (const serverPath of candidates) {
  if (!existsSync(serverPath)) continue;
  // #region agent log
  console.error(JSON.stringify({ sessionId: '59fcd2', hypothesisId: 'C', location: 'hostinger-boot.mjs', message: 'starting server', data: { serverPath, cwd: path.dirname(serverPath), port }, timestamp: Date.now() }));
  // #endregion
  execFileSync(process.execPath, [serverPath], {
    cwd: path.dirname(serverPath),
    stdio: 'inherit',
    env,
  });
  process.exit(0);
}

// #region agent log
console.error(JSON.stringify({ sessionId: '59fcd2', hypothesisId: 'C', location: 'hostinger-boot.mjs', message: 'no server found', data: { nextDir, candidates }, timestamp: Date.now() }));
// #endregion
process.exit(1);
`;
  writeFileSync(bootPath, bootSource);
  return bootPath;
}

export function runHostingerPostbuild(app) {
  const appDir = path.join(root, 'apps', app);
  const nextDir = path.join(appDir, '.next');
  const standaloneDir = path.join(nextDir, 'standalone');

  if (!existsSync(standaloneDir)) {
    console.error(`[hostinger-postbuild] missing standalone output for ${app}`);
    return null;
  }

  const serverPath = findStandaloneServer(standaloneDir, app);
  if (!serverPath) {
    console.error(`[hostinger-postbuild] server.js not found under ${standaloneDir}`);
    return null;
  }

  const serverDir = path.dirname(serverPath);
  const staticSrc = path.join(nextDir, 'static');
  const staticDest = path.join(serverDir, '.next/static');
  if (existsSync(staticSrc)) {
    mkdirSync(path.dirname(staticDest), { recursive: true });
    cpSync(staticSrc, staticDest, { recursive: true });
  }

  const publicSrc = path.join(appDir, 'public');
  const publicDest = path.join(serverDir, 'public');
  if (existsSync(publicSrc) && !existsSync(publicDest)) {
    cpSync(publicSrc, publicDest, { recursive: true });
  }

  const bootPath = writeBootScript(nextDir, app, serverPath);
  const meta = { app, serverPath, bootPath, nextDir };
  writeFileSync(path.join(nextDir, 'hostinger-server.json'), JSON.stringify(meta, null, 2));
  console.error(`[hostinger-postbuild] ${app} ready: ${serverPath}`);
  return meta;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const app = process.argv[2];
  if (app !== 'admin' && app !== 'agent') {
    console.error('Usage: node scripts/hostinger-postbuild.mjs <admin|agent>');
    process.exit(1);
  }
  runHostingerPostbuild(app);
}
