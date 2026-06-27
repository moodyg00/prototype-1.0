import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { entryBootSource } from './hostinger-serve-core.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function writeServerJs(nextDir, app) {
  const relServer = `standalone/apps/${app}/server.js`;
  writeFileSync(
    path.join(nextDir, 'server.js'),
    `'use strict';
const { createRequire } = require('node:module');
const { existsSync } = require('node:fs');
const path = require('node:path');

const nextDir = __dirname;
const serverPath = path.join(nextDir, '${relServer}');
const port = process.env.PORT || '3000';
process.env.PORT = port;
process.env.HOSTNAME = process.env.HOSTNAME || '0.0.0.0';

if (!existsSync(serverPath)) {
  console.error('[hostinger] missing ' + serverPath);
  process.exit(1);
}

process.chdir(path.dirname(serverPath));
createRequire(__filename)(serverPath);
setInterval(function keepAlive() {}, 0x7fffffff);
`,
  );
}

function writeOutputEntry(nextDir, app) {
  const boot = entryBootSource(app);
  const scriptsDir = path.join(nextDir, 'scripts');
  mkdirSync(scriptsDir, { recursive: true });
  writeFileSync(path.join(scriptsDir, `hostinger-serve-${app}.mjs`), boot);
  writeFileSync(
    path.join(nextDir, 'package.json'),
    JSON.stringify({ type: 'commonjs', scripts: { start: 'node server.js' } }, null, 2),
  );
  if (process.env.HOSTINGER_APP === app) {
    writeFileSync(path.join(root, 'scripts', `hostinger-serve-${app}.mjs`), boot);
  }
}

export function runHostingerPostbuild(app) {
  const appDir = path.join(root, 'apps', app);
  const nextDir = path.join(appDir, '.next');
  const standaloneDir = path.join(nextDir, 'standalone');
  const absServer = path.join(standaloneDir, 'apps', app, 'server.js');

  if (!existsSync(absServer)) {
    console.error(`[hostinger-postbuild] missing ${absServer}`);
    return null;
  }

  const serverDir = path.dirname(absServer);
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

  writeServerJs(nextDir, app);
  writeOutputEntry(nextDir, app);
  writeFileSync(
    path.join(nextDir, 'hostinger-server.json'),
    JSON.stringify({ app, serverPath: `standalone/apps/${app}/server.js` }, null, 2),
  );
  console.error(`[hostinger-postbuild] ${app} ready (standalone/apps/${app}/server.js)`);
  return { app, nextDir };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const app = process.argv[2];
  if (app !== 'admin' && app !== 'agent') {
    console.error('Usage: node scripts/hostinger-postbuild.mjs <admin|agent>');
    process.exit(1);
  }
  runHostingerPostbuild(app);
}
