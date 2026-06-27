import { createRequire } from 'node:module';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

/** Self-contained boot script for Hostinger output dirs (no monorepo imports). */
export function entryBootSource(app) {
  return `import { createRequire } from 'node:module';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const app = '${app}';
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

  const directInOutput = path.join(cwd, 'standalone', 'apps', app, 'server.js');
  if (existsSync(directInOutput)) return directInOutput;

  const directInRepo = path.join(cwd, 'apps', app, '.next', 'standalone', 'apps', app, 'server.js');
  if (existsSync(directInRepo)) return directInRepo;

  return null;
}

const serverPath = resolveStandaloneServer();
if (!serverPath) {
  console.error(\`[hostinger-boot] no standalone server under \${process.cwd()}\`);
  process.exit(1);
}

process.chdir(path.dirname(serverPath));
requireMod(serverPath);
setInterval(() => {}, 1 << 30);
`;
}

export function resolveStandaloneServer(app, cwd = process.cwd()) {
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

  const directInOutput = path.join(cwd, 'standalone', 'apps', app, 'server.js');
  if (existsSync(directInOutput)) return directInOutput;

  const directInRepo = path.join(cwd, 'apps', app, '.next', 'standalone', 'apps', app, 'server.js');
  if (existsSync(directInRepo)) return directInRepo;

  return null;
}

export function startStandaloneServer(app, options = {}) {
  const requireMod = createRequire(import.meta.url);
  process.env.PORT = options.port ?? process.env.PORT ?? '3000';
  process.env.HOSTNAME = options.hostname ?? process.env.HOSTNAME ?? '0.0.0.0';

  const serverPath = resolveStandaloneServer(app, options.cwd ?? process.cwd());
  if (!serverPath) {
    console.error(`[hostinger-boot] no standalone server under ${options.cwd ?? process.cwd()}`);
    process.exit(1);
  }

  process.chdir(path.dirname(serverPath));
  requireMod(serverPath);
  setInterval(() => {}, 1 << 30);
}