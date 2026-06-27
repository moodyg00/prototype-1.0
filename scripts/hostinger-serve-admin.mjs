import { createRequire } from 'node:module';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const app = 'admin';
const requireMod = createRequire(import.meta.url);
process.env.PORT = process.env.PORT ?? '3000';
process.env.HOSTNAME = process.env.HOSTNAME ?? '0.0.0.0';

function resolveStandaloneServer() {
  const cwd = process.cwd();
  
  // 1. If cwd is the output directory (e.g. apps/admin/.next)
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

  // 2. Direct check if cwd is the output directory
  const directInOutput = path.join(cwd, 'standalone', 'apps', app, 'server.js');
  if (existsSync(directInOutput)) return directInOutput;

  // 3. If cwd is the monorepo root (Hostinger "Root directory: ./")
  const directInRepo = path.join(cwd, 'apps', app, '.next', 'standalone', 'apps', app, 'server.js');
  if (existsSync(directInRepo)) return directInRepo;

  return null;
}

const serverPath = resolveStandaloneServer();
if (!serverPath) {
  console.error(`[hostinger-boot] no standalone server under ${process.cwd()}`);
  process.exit(1);
}

process.chdir(path.dirname(serverPath));
requireMod(serverPath);
setInterval(() => {}, 1 << 30);
