#!/usr/bin/env node
/**
 * Phase 1: prune design explorations to 1–2 variants per category.
 * Run from repo root: node scripts/prune-design-explorations.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const ADMIN = path.join(ROOT, 'apps/admin');
const MANIFEST_PATH = path.join(ADMIN, 'src/design/manifest.ts');
const EXPLORATIONS = path.join(ADMIN, 'components/design/explorations');
const ARCHIVE = path.join(EXPLORATIONS, 'archive');

const CATEGORY_IDS = [
  'header', 'sidebar', 'buttons', 'inputs', 'selects', 'tables', 'cards',
  'dialogs', 'toasts', 'tabs', 'empty-states', 'loading', 'form-layouts', 'page-header',
];

function parseManifest(source) {
  const favoritesMatch = source.match(/export const FAVORITES[^[]*\[([\s\S]*?)\];/);
  const favorites = [...favoritesMatch[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);

  const variants = [];
  const entryRe = /\{\s*slug:\s*'([^']+)',\s*category:\s*'([^']+)',\s*number:\s*(\d+),[\s\S]*?file:\s*'([^']+)',\s*exportName:\s*'([^']+)',/g;
  for (const match of source.matchAll(entryRe)) {
    variants.push({
      slug: match[1],
      category: match[2],
      number: Number(match[3]),
      file: match[4],
      exportName: match[5],
    });
  }

  return { favorites, variants };
}

function keepSlugsForCategory(variants, favorites, category) {
  const inCategory = variants
    .filter((v) => v.category === category)
    .sort((a, b) => a.number - b.number);

  const keep = new Set();
  for (const slug of favorites) {
    if (keep.size >= 2) break;
    if (inCategory.some((v) => v.slug === slug)) keep.add(slug);
  }
  for (const variant of inCategory) {
    if (keep.size >= 2) break;
    keep.add(variant.slug);
  }
  return keep;
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function moveToArchive(fileRel) {
  const src = path.join(ADMIN, fileRel);
  if (!fs.existsSync(src)) {
    console.warn('missing', fileRel);
    return;
  }
  const destRel = fileRel.replace('components/design/explorations/', 'components/design/explorations/archive/');
  const dest = path.join(ADMIN, destRel);
  ensureDir(path.dirname(dest));
  fs.renameSync(src, dest);
  console.log('archived', path.basename(fileRel));
}

function regenerateExplorationsFile(category, keptVariants) {
  const pascal = category
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
  const fileName = `${pascal}Explorations.tsx`;
  const filePath = path.join(EXPLORATIONS, category, fileName);
  if (!fs.existsSync(filePath)) {
    console.warn('no explorations file', filePath);
    return;
  }

  const imports = keptVariants
    .map((v) => `import { ${v.exportName} } from '@/components/design/explorations/${category}/Variation${String(v.number).padStart(2, '0')}';`)
    .join('\n');

  const componentMap = keptVariants
    .map((v) => `  '${v.slug}': ${v.exportName},`)
    .join('\n');

  const content = `'use client';

import * as React from 'react';
import { VariationFrame } from '@/components/design/VariationFrame';
import { FAVORITES, getVariantsByCategory } from '@/src/design/manifest';
${imports}

const COMPONENT_BY_SLUG: Record<string, React.ComponentType> = {
${componentMap}
};

export function ${pascal}Explorations() {
  const variants = getVariantsByCategory('${category}');
  return (
    <div className="space-y-12">
      {variants.map((v) => {
        const Component = COMPONENT_BY_SLUG[v.slug];
        if (!Component) return null;
        const isFavorite = (FAVORITES as readonly string[]).includes(v.slug);
        return (
          <VariationFrame
            key={v.slug}
            slug={v.slug}
            category={v.category}
            number={v.number}
            displayName={v.displayName}
            intent={v.intent}
            isFavorite={isFavorite}
          >
            <Component />
          </VariationFrame>
        );
      })}
    </div>
  );
}
`;

  fs.writeFileSync(filePath, content);
  console.log('regenerated', fileName);
}

function filterManifestVariants(source, keptVariants) {
  const keptSlugs = new Set(keptVariants.map((v) => v.slug));
  const blocks = source.split(/(?=\n  \{\n    slug:)/);
  const head = blocks[0];
  const variantBlocks = blocks.slice(1);
  const keptBlocks = variantBlocks.filter((block) => {
    const slugMatch = block.match(/slug:\s*'([^']+)'/);
    return slugMatch && keptSlugs.has(slugMatch[1]);
  });
  const tailStart = source.indexOf('\n];\n\n/**');
  const tail = tailStart >= 0 ? source.slice(tailStart + 3) : source.slice(source.indexOf('export const FAVORITES'));
  return `${head}${keptBlocks.join('')}\n];\n\n${tail}`;
}

function main() {
  const source = fs.readFileSync(MANIFEST_PATH, 'utf8');
  const { favorites, variants } = parseManifest(source);

  const kept = [];
  const archived = [];

  for (const category of CATEGORY_IDS) {
    const keep = keepSlugsForCategory(variants, favorites, category);
    const inCategory = variants.filter((v) => v.category === category);
    for (const variant of inCategory) {
      if (keep.has(variant.slug)) kept.push(variant);
      else archived.push(variant);
    }
    regenerateExplorationsFile(category, kept.filter((v) => v.category === category));
  }

  for (const variant of archived) moveToArchive(variant.file);

  const trimmedFavorites = favorites.filter((slug) => kept.some((v) => v.slug === slug));
  let newSource = filterManifestVariants(source, kept);
  newSource = newSource.replace(
    /export const FAVORITES[^[]*\[[\s\S]*?\];/,
    `export const FAVORITES: readonly string[] = [\n${trimmedFavorites.map((s) => `  '${s}',`).join('\n')}\n];`,
  );
  fs.writeFileSync(MANIFEST_PATH, newSource);

  console.log(`\nDone: kept ${kept.length} variants, archived ${archived.length}.`);
}

main();