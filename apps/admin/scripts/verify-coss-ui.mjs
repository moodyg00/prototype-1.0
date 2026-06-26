#!/usr/bin/env node

import { execSync } from 'node:child_process';
import fs from 'node:fs';

function getRegistryUiSet() {
  const raw = execSync('curl -fsSL https://coss.com/ui/r/registry.json', {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const registry = JSON.parse(raw);
  const ui = registry.items?.find(
    (item) => item?.name === 'ui' && Array.isArray(item?.registryDependencies),
  );

  if (!ui) {
    throw new Error('Could not find `ui.registryDependencies` in COSS registry.');
  }

  return new Set(
    ui.registryDependencies
      .filter((dep) => dep.startsWith('@coss/'))
      .map((dep) => dep.replace('@coss/', '')),
  );
}

function getLocalUiSet() {
  const files = fs
    .readdirSync('components/ui', { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.tsx'))
    .map((entry) => entry.name.replace(/\.tsx$/, ''));

  return new Set(files);
}

function sorted(values) {
  return [...values].sort((a, b) => a.localeCompare(b));
}

try {
  const registry = getRegistryUiSet();
  const local = getLocalUiSet();

  const missing = sorted([...registry].filter((name) => !local.has(name)));
  const extra = sorted([...local].filter((name) => !registry.has(name)));

  if (missing.length === 0 && extra.length === 0) {
    console.log('COSS UI verification passed: local components/ui exactly matches registry set.');
    process.exit(0);
  }

  console.error('COSS UI verification failed.');

  if (missing.length > 0) {
    console.error('\nMissing COSS components:');
    for (const name of missing) console.error(`- ${name}`);
  }

  if (extra.length > 0) {
    console.error('\nNon-COSS components found in components/ui:');
    for (const name of extra) console.error(`- ${name}`);
    console.error('\nMove custom components outside components/ui (for example src/components/admin).');
  }

  process.exit(1);
} catch (error) {
  console.error('COSS UI verification error:', error.message);
  process.exit(1);
}
