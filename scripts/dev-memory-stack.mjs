#!/usr/bin/env node
/**
 * Ensure Postgres and Chroma are reachable for agent memory dev.
 * Starts Chroma in the background only when port 8000 is not already serving.
 *
 * Usage: pnpm dev:memory-stack
 * Then:  pnpm dev:agent  (separate terminal)
 */
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const CHROMA_URL = (process.env.CHROMA_URL ?? 'http://localhost:8000').replace(/\/$/, '');
const CHROMA_PORT = Number(process.env.CHROMA_PORT ?? 8000);
const PG_HOST = process.env.PGHOST ?? 'localhost';
const PG_PORT = Number(process.env.PGPORT ?? 5432);
const STARTUP_TIMEOUT_MS = 30_000;

function portOpen(host, port) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port });
    const done = (ok) => {
      socket.destroy();
      resolve(ok);
    };
    socket.setTimeout(2000);
    socket.on('connect', () => done(true));
    socket.on('timeout', () => done(false));
    socket.on('error', () => done(false));
  });
}

async function chromaReady() {
  try {
    const res = await fetch(`${CHROMA_URL}/api/v2/heartbeat`, {
      signal: AbortSignal.timeout(2000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function waitForChroma(label) {
  const started = Date.now();
  while (Date.now() - started < STARTUP_TIMEOUT_MS) {
    if (await chromaReady()) return true;
    await new Promise((r) => setTimeout(r, 500));
  }
  console.error(`${label} did not become ready within ${STARTUP_TIMEOUT_MS / 1000}s`);
  return false;
}

function startChromaDetached() {
  const chromaBin = path.join(root, 'packages/memory/node_modules/.bin/chroma');
  if (!existsSync(chromaBin)) {
    console.error('Chroma CLI not found. Run: pnpm install');
    process.exit(1);
  }

  const dataDir = path.join(root, 'data/chroma');
  const child = spawn(chromaBin, ['run', '--path', dataDir, '--port', String(CHROMA_PORT)], {
    detached: true,
    stdio: 'ignore',
    cwd: root,
  });
  child.unref();
  return child.pid;
}

async function main() {
  console.log('Memory stack check\n');

  const pgOk = await portOpen(PG_HOST, PG_PORT);
  if (pgOk) {
    console.log(`✓ Postgres reachable at ${PG_HOST}:${PG_PORT}`);
  } else {
    console.error(`✗ Postgres not reachable at ${PG_HOST}:${PG_PORT}`);
    console.error('  Start local Postgres or run: pnpm docker:up (requires Docker/Colima)');
    process.exit(1);
  }

  if (await chromaReady()) {
    console.log(`✓ Chroma already running at ${CHROMA_URL}`);
  } else if (await portOpen('localhost', CHROMA_PORT)) {
    console.error(`✗ Port ${CHROMA_PORT} is in use but Chroma heartbeat failed at ${CHROMA_URL}`);
    process.exit(1);
  } else {
    const pid = startChromaDetached();
    console.log(`… Starting Chroma (pid ${pid}, data/chroma)…`);
    if (!(await waitForChroma('Chroma'))) process.exit(1);
    console.log(`✓ Chroma running at ${CHROMA_URL}`);
  }

  console.log('\nMemory stack ready. In another terminal:');
  console.log('  pnpm dev:agent');
  console.log('\nEnsure apps/agent/.env.local includes:');
  console.log('  CHROMA_URL=http://localhost:8000');
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
