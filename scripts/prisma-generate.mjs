import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dbDir = path.join(rootDir, 'packages/db');

function resolvePrismaCli(fromDir) {
  const requireFrom = createRequire(path.join(fromDir, 'package.json'));
  return requireFrom.resolve('prisma/build/index.js');
}

let prismaCli;
try {
  prismaCli = resolvePrismaCli(dbDir);
} catch {
  prismaCli = resolvePrismaCli(rootDir);
}

execFileSync(process.execPath, [prismaCli, 'generate'], {
  cwd: dbDir,
  stdio: 'inherit',
});
