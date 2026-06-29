#!/usr/bin/env node
/**
 * Copy a public-dev site project → apps/public-site/ (local live docroot simulation).
 * Usage: node scripts/promote-public-site.mjs [slug] [--dry-run]
 * Default slug: home-services
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2).filter((a) => a !== '--dry-run');
const slug = args[0] || 'home-services';
const dryRun = process.argv.includes('--dry-run');
const source = path.join(root, 'apps/public-dev/sites', slug);
const target = path.join(root, 'apps/public-site');

async function copyRecursive(sourceDir, targetDir) {
  await fs.mkdir(targetDir, { recursive: true });
  const entries = await fs.readdir(sourceDir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === '.project.json' || entry.name === '.deploy-ignore') continue;
    const from = path.join(sourceDir, entry.name);
    const to = path.join(targetDir, entry.name);
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
  await fs.access(source);
  await copyRecursive(source, target);
  console.log(dryRun ? 'Dry run complete.' : `Promoted sites/${slug} → apps/public-site/.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
