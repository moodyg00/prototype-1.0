import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { runHostingerPostbuild } from './hostinger-postbuild.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const app = process.env.HOSTINGER_APP;

function pnpm(args) {
  execFileSync('npm', ['exec', 'pnpm', '--', ...args], {
    cwd: root,
    stdio: 'inherit',
    env: process.env,
  });
}

if (app === 'agent') {
  pnpm(['--filter', '@prototype/agent', 'build']);
  runHostingerPostbuild('agent');
} else if (app === 'admin') {
  pnpm(['--filter', '@prototype/admin', 'build']);
  runHostingerPostbuild('admin');
} else if (app === 'worker') {
  // worker has no next build
  process.exit(0);
} else {
  // Local / CI — avoid turbo native binary (EACCES on some hosts)
  pnpm([
    '--filter',
    '@prototype/db',
    '--filter',
    '@prototype/admin',
    '--filter',
    '@prototype/agent',
    'run',
    'build',
  ]);
}
