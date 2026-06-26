import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function startHostingerApp(app) {
  const appDir = path.join(root, 'apps', app);
  const port = process.env.PORT || (app === 'admin' ? '3001' : '3002');
  const env = {
    ...process.env,
    PORT: port,
    HOSTNAME: '0.0.0.0',
  };

  const standaloneCandidates = [
    path.join(appDir, '.next/standalone/apps', app, 'server.js'),
    path.join(appDir, '.next/standalone/server.js'),
  ];

  for (const serverPath of standaloneCandidates) {
    if (!existsSync(serverPath)) continue;
    execFileSync(process.execPath, [serverPath], {
      cwd: path.dirname(serverPath),
      stdio: 'inherit',
      env,
    });
    return;
  }

  const requireFrom = createRequire(path.join(appDir, 'package.json'));
  const nextCli = requireFrom.resolve('next/dist/bin/next');
  execFileSync(process.execPath, [nextCli, 'start', '-p', port, '-H', '0.0.0.0'], {
    cwd: appDir,
    stdio: 'inherit',
    env,
  });
}
