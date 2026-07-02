import { ALL_TOOL_IDS, type ToolId } from './tools';

// Renames: an old id that should transparently become a still-existing tool.
const LEGACY_TOOL_ID_RENAMES: Record<string, ToolId> = {
  photos: 'media-library',
  'visual-browser': 'browser',
  'pure-browser': 'browser',
};

// Removals: old ids for tools/panels that were intentionally deleted (org-chart/
// C-Suite panel, "coming soon" stub cards). These must be dropped from persisted
// layouts entirely rather than passed through as a `ToolId` — leaving them in
// would make `getTool()` silently fall back to `TOOLS[0]` for every one of them,
// which is exactly what caused the default layout to show a wall of duplicate
// "Workflow" icons after `team`/`agents`/`documents`/`analytics`/`mobile`/`website`
// were removed from `TOOLS`.
const REMOVED_TOOL_IDS = new Set(['team', 'documents', 'analytics', 'mobile', 'website']);
/** Stripped from tooltip bars on load — runner lives inside the workflow studio. */
const TOOLBAR_STRIPPED_IDS = new Set(['runner']);

const VALID_TOOL_IDS = new Set<string>(ALL_TOOL_IDS);

/**
 * Migrates a single persisted tool id. Returns `null` when the id refers to a
 * tool that no longer exists and has no replacement, so callers can drop it
 * instead of coercing it into a bogus `ToolId`.
 */
export function migrateLegacyToolId(id: string): ToolId | null {
  const renamed = LEGACY_TOOL_ID_RENAMES[id] ?? id;
  if (REMOVED_TOOL_IDS.has(id) || !VALID_TOOL_IDS.has(renamed)) return null;
  return renamed as ToolId;
}

export function migrateToolIdList(ids: string[]): ToolId[] {
  const migrated = ids
    .map((id) => migrateLegacyToolId(id))
    .filter((id): id is ToolId => id !== null)
    .filter((id) => !TOOLBAR_STRIPPED_IDS.has(id));
  // Multiple legacy ids can collapse onto the same tool (e.g. the old
  // `visual-browser`/`pure-browser`/`browser` trio all became `browser`).
  return [...new Set(migrated)];
}