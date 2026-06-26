import fs from 'node:fs';
import path from 'node:path';

import dotenv from 'dotenv';

for (const envPath of [
  path.resolve(process.cwd(), '.env.local'),
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '../admin/.env.local'),
  path.resolve(process.cwd(), '../admin/.env'),
]) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
}

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) {
    throw new Error(`Missing ${name}. Set it in apps/worker/.env.local or apps/admin/.env.local.`);
  }
  return value;
}

export const workerConfig = {
  port: Number.parseInt(process.env.WORKER_PORT ?? '3003', 10),
  cronSecret: process.env.CRON_SECRET ?? process.env.WORKER_SECRET ?? '',
  adminBaseUrl: (process.env.ADMIN_BASE_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3001').replace(
    /\/$/,
    '',
  ),
};

export function assertWorkerReady(): void {
  required('ADMIN_BASE_URL', workerConfig.adminBaseUrl);
  if (!workerConfig.cronSecret) {
    console.warn('[worker] CRON_SECRET not set — job routes will reject requests until configured.');
  }
}
