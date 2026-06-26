---
name: add-component
description: Copies a named design-library variant from src/design/manifest.ts into a target path inside the consumer codebase, stripping mock data and renaming the export. Use whenever the user says "add component <slug>", "install <slug> from design library", "/add-component <slug>", "copy the <slug> variant", or otherwise asks to pull a variant out of the proto-2 design library into product code.
---

# add-component

Copies one variant out of the proto-2 design library (`components/design/explorations/<category>/Variation0N.tsx`) into a real consumer location (e.g. `components/marketing/Header.tsx`). Strips the in-library mock data so the copied file is prop-driven and type-checks on its own.

## Invocation

```
add-component <slug> <target-path> [--name CustomName] [--force]
```

- `<slug>` — the manifest slug (e.g. `header-classic-shell`, `card-stat-sparkline`, `empty-state-permission-locked`).
- `<target-path>` — destination file, project-relative. Parent directories are created as needed.
- `--name CustomName` — override the exported component name. Default: PascalCase of the target file basename.
- `--force` — overwrite the destination if it already exists.

## Manifest contract

The source of truth for slugs is `src/design/manifest.ts` in the proto-2 repo. Each entry has:

```ts
{ slug, category, number, displayName, intent, file, exportName, tags? }
```

`file` is the project-relative path to the variation source. `exportName` is the named export inside that file (PascalCase form of the slug).

If the requested slug is not in `VARIANTS`, refuse and list the 5 closest matches (substring or Levenshtein).

## Mock-block convention

Every variation file in the library is authored as a prop-driven component with mock defaults wrapped in markers:

```tsx
// @mock-start
const MOCK_NAV_ITEMS = [
  { label: 'Operations', href: '/ops', active: true },
  // ...
] as const;
// @mock-end

export interface HeaderClassicShellProps {
  items?: ReadonlyArray<{ label: string; href: string; active?: boolean }>;
  // ...
}

export function HeaderClassicShell({ items = MOCK_NAV_ITEMS }: HeaderClassicShellProps) {
  return ( /* ...JSX using `items` */ );
}
```

In-library, the wrapper component renders `<HeaderClassicShell />` with no props so the mock data drives the preview. When copied to the consumer, the mock blocks are stripped — props become required and defaults disappear.

Purely-decorative variants still emit an empty `interface XxxProps {}` and a no-op `// @mock-start` / `// @mock-end` pair on adjacent lines, so the strip logic is uniform.

## Workflow

1. **Resolve the slug.** Read `src/design/manifest.ts` and find the `VariantEntry` whose `slug === <slug>`. If not found, list close matches and stop.
2. **Read the source file.** Use the `file` field as a project-relative path.
3. **Strip mock blocks.** Remove every line range that starts with a line matching `^\s*//\s*@mock-start\b` up to and including the next line matching `^\s*//\s*@mock-end\b`. Repeat until no markers remain. If the file contains an opening marker with no closing marker, refuse with an error.
4. **Strip empty imports.** After stripping, remove any remaining `import {} from '...';` lines. This is best-effort — see "Known limitations" below.
5. **Rename the export.** Decide the new name:
   - Default: `PascalCase(<target file basename without extension>)`.
   - `--name CustomName` override always wins.
   Then, inside the source text, rename `exportName` (from the manifest) to the new name **everywhere it appears as an identifier**. Use a word-boundary regex (`\b<exportName>\b`) so it doesn't accidentally touch a substring inside another identifier.
6. **Write the destination.**
   - Refuse if the destination exists unless `--force` is passed.
   - Create any missing parent directories.
   - Write the post-transform text.
7. **Print a one-line confirmation** with:
   - `slug`
   - `displayName` from the manifest
   - target path
   - the new exported name
   - the public prop fields the consumer still needs to wire (from the `Props` interface — list each prop name; mark optional vs required)

## Worked examples

```
# Marketing header
add-component header-classic-shell components/marketing/Header.tsx
# → copies Variation01.tsx, renames HeaderClassicShell → Header,
#   strips MOCK_NAV / MOCK_USER, writes components/marketing/Header.tsx

# KPI card on the dashboard
add-component card-stat-sparkline components/dashboard/RevenueStat.tsx --name RevenueStat
# → renames CardStatSparkline → RevenueStat

# Locked permission empty state
add-component empty-state-permission-locked app/billing/components/Locked.tsx
# → renames EmptyStatePermissionLocked → Locked
```

## Failure modes

- **Slug not found.** List up to 5 manifest slugs whose `slug` or `displayName` most closely matches the input. Do not write anything.
- **Target exists.** Refuse and instruct the user to re-run with `--force`.
- **Mock marker mismatch.** If `// @mock-start` appears without a matching `// @mock-end`, refuse — the source file is broken and should be repaired in the library before copying out.
- **Project root not detected.** This skill assumes it is being run inside the proto-2 repo. If `src/design/manifest.ts` cannot be found, refuse with a clear message.

## Known limitations

- **Dead-import removal is best-effort.** The skill removes obviously-empty `import {} from '...';` lines and lines whose only named import was used inside the stripped mock block (a simple text scan). It does not run a full TypeScript AST pass, so an unused import that was only referenced inside the mock block but stayed visually adjacent to other code may slip through. The consumer can rely on the next `tsc --noEmit` / IDE lint to surface unused imports.
- **Type literals defined only by mock data are not synthesized.** If the variation defined a `type Stat = {...}` that lived inside the mock block, that type is gone after the strip. The author of the variation should hoist any type used by the `Props` interface above the `// @mock-start` line so it survives.
- **No JSX rewrites.** The skill only renames identifiers and strips mock blocks. If the JSX directly references mock identifiers (e.g. `NAV.map(...)`) instead of the prop alias, the copied file will fail to compile until the user wires real props. The variation refactor passes mock arrays through destructured prop defaults so this should not happen in well-authored variations.

## After copying

Tell the user:
1. The exported component name and target path.
2. The required props they must supply (anything without a `?` in the `Props` interface).
3. That the file is plain TS/TSX — run `tsc --noEmit` or open it in the editor to catch any leftover dead imports.
