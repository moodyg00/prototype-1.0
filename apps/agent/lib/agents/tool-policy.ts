import { getTool, TOOLBAR_TOOL_IDS, type ToolId } from '@/lib/tools';
import type { WorkspaceAgent } from './types';

export function isAgentToolEnabled(agent: WorkspaceAgent, toolId: ToolId): boolean {
  const allowed = agent.tools.enabledToolIds ?? [];
  if (allowed.length === 0) return true;
  return allowed.includes(toolId);
}

export function formatEnabledToolsForPrompt(agent: WorkspaceAgent): string | null {
  const allowed = agent.tools.enabledToolIds ?? [];
  if (allowed.length === 0) return null;
  const labels = allowed
    .filter((id): id is ToolId => TOOLBAR_TOOL_IDS.includes(id as ToolId))
    .map((id) => getTool(id).label);
  if (!labels.length) return null;
  return [
    'Enabled IDE capabilities (stay within these unless the user explicitly needs something else):',
    ...labels.map((l) => `- ${l}`),
  ].join('\n');
}