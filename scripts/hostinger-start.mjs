import { createRequire } from 'node:module';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const app = process.env.HOSTINGER_APP;
if (app !== 'admin' && app !== 'agent') {
  console.error('Set HOSTINGER_APP=admin or HOSTINGER_APP=agent');
  process.exit(1);
}

const requireMod = createRequire(import.meta.url);
process.env.PORT = process.env.PORT ?? '3000';
process.env.HOSTNAME = process.env.HOSTNAME ?? '0.0.0.0';

function resolveStandaloneServer() {
  const cwd = process.cwd();
  const metaPath = path.join(cwd, 'hostinger-server.json');
  if (existsSync(metaPath)) {
    try {
      const meta = JSON.parse(readFileSync(metaPath, 'utf8'));
      if (meta.serverPath) {
        const abs = path.join(cwd, meta.serverPath);
        if (existsSync(abs)) return abs;
      }
    } catch {
      /* ignore invalid meta */
    }
  }
  const direct = path.join(cwd, 'standalone', 'apps', app, 'server.js');
  return existsSync(direct) ? direct : null;
}

const serverPath = resolveStandaloneServer();
if (!serverPath) {
  console.error(`[hostinger-boot] no standalone server under ${process.cwd()}`);
  process.exit(1);
}

process.chdir(path.dirname(serverPath));
requireMod(serverPath);
setInterval(() => {}, 1 << 30);
