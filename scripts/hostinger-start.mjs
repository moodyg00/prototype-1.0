import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const app = process.env.HOSTINGER_APP;

if (app !== 'admin' && app !== 'agent') {
  console.error('Set HOSTINGER_APP=admin or HOSTINGER_APP=agent in Hostinger env vars.');
  process.exit(1);
}

const appDir = path.join(root, 'apps', app);
const port = process.env.PORT || (app === 'admin' ? '3001' : '3002');

execFileSync('npm', ['run', 'start', '--', '-p', port], {
  cwd: appDir,
  stdio: 'inherit',
  env: process.env,
});
