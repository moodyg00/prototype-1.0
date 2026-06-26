#!/usr/bin/env node
/**
 * Copy dev static site → live static site (local promote workflow).
 * Usage: node scripts/promote-public-site.mjs [--dry-run]
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const devDir = path.join(root, 'apps/public-site/dev');
const liveDir = path.join(root, 'apps/public-site/live');
const dryRun = process.argv.includes('--dry-run');

async function copyRecursive(source, target) {
  await fs.mkdir(target, { recursive: true });
  const entries = await fs.readdir(source, { withFileTypes: true });
  for (const entry of entries) {
    const from = path.join(source, entry.name);
    const to = path.join(target, entry.name);
    if (entry.isDirectory()) {
      await copyRecursive(from, to);
    } else if (entry.isFile()) {
      if (dryRun) {
        console.log(`[dry-run] ${from} → ${to}`);
      } else {
        await fs.copyFile(from, to);
        console.log(`copied ${entry.name}`);
      }
    }
  }
}

async function main() {
  await fs.access(devDir);
  await copyRecursive(devDir, liveDir);
  console.log(dryRun ? 'Dry run complete.' : 'Promoted dev → live.');
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
