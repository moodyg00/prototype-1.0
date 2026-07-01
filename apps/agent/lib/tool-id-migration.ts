import type { ToolId } from './tools';

const LEGACY_TOOL_IDS: Record<string, ToolId> = {
  photos: 'media-library',
};

export function migrateLegacyToolId(id: string): ToolId {
  return (LEGACY_TOOL_IDS[id] ?? id) as ToolId;
}

export function migrateToolIdList(ids: string[]): ToolId[] {
  return ids.map((id) => migrateLegacyToolId(id));
}