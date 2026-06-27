import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const bootLibSource = path.join(root, 'scripts/hostinger-boot-lib.mjs');

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

function writeOutputEntry(nextDir, app) {
  const scriptsDir = path.join(nextDir, 'scripts');
  mkdirSync(scriptsDir, { recursive: true });
  cpSync(bootLibSource, path.join(scriptsDir, 'hostinger-boot-lib.mjs'));
  writeFileSync(
    path.join(scriptsDir, `hostinger-serve-${app}.mjs`),
    `import { bootHostingerApp } from './hostinger-boot-lib.mjs';\nbootHostingerApp('${app}');\n`,
  );
  writeFileSync(
    path.join(nextDir, 'server.js'),
    `'use strict';
const { createRequire } = require('node:module');
const { existsSync, readFileSync } = require('node:fs');
const path = require('node:path');

const nextDir = __dirname;
const requireApp = createRequire(__filename);
const metaPath = path.join(nextDir, 'hostinger-server.json');
const meta = existsSync(metaPath) ? JSON.parse(readFileSync(metaPath, 'utf8')) : null;
const candidates = [
  meta && meta.serverPath,
  path.join(nextDir, 'standalone/apps/${app}/server.js'),
  path.join(nextDir, 'standalone/server.js'),
].filter(Boolean);
const port = process.env.PORT || '3000';
process.env.PORT = port;
process.env.HOSTNAME = process.env.HOSTNAME || '0.0.0.0';

console.error(JSON.stringify({ sessionId: '59fcd2', hypothesisId: 'H', location: 'server.js', message: 'boot start', data: { nextDir, port, candidates }, timestamp: Date.now() }));

for (const serverPath of candidates) {
  if (!existsSync(serverPath)) continue;
  console.error(JSON.stringify({ sessionId: '59fcd2', hypothesisId: 'H', location: 'server.js', message: 'starting', data: { serverPath, port }, timestamp: Date.now() }));
  process.chdir(path.dirname(serverPath));
  requireApp(serverPath);
  setInterval(function keepAlive() {}, 0x7fffffff);
  return;
}
console.error(JSON.stringify({ sessionId: '59fcd2', hypothesisId: 'H', location: 'server.js', message: 'no server found', data: { nextDir, candidates }, timestamp: Date.now() }));
process.exit(1);
`,
  );
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

  writeOutputEntry(nextDir, app);
  const meta = {
    app,
    serverPath,
    nextDir,
    entryOptions: [
      `standalone/apps/${app}/server.js`,
      'server.js',
      `scripts/hostinger-serve-${app}.mjs`,
    ],
  };
  writeFileSync(path.join(nextDir, 'hostinger-server.json'), JSON.stringify(meta, null, 2));
  console.error(`[hostinger-postbuild] ${app} ready: ${serverPath}`);
  console.error(`[hostinger-postbuild] ${app} entry options: ${meta.entryOptions.join(' | ')}`);
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
