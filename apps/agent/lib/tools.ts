import {
  Activity,
  Bot,
  Brain,
  Camera,
  GitBranch,
  HelpCircle,
  Images,
  Play,
  UserCog,
  Video,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ToolSurface } from './tool-surfaces';

export type ToolId =
  | 'workflow'
  | 'runner'
  | 'runs'
  | 'browser'
  | 'video'
  | 'photography'
  | 'memory'
  | 'media-library'
  | 'agents';

export interface ToolSurfaceHints {
  preferredOpen?: ToolSurface;
  floatingDefaultSize?: { w: number; h: number };
}

export interface ToolDef {
  id: ToolId;
  label: string;
  icon: LucideIcon;
  description: string;
  source: string;
  status: 'built' | 'pending';
  defaultSize: { w: number; h: number };
  surfaceHints?: ToolSurfaceHints;
}

export const TOOLS: ToolDef[] = [
  { id: 'workflow', label: 'Workflow', icon: GitBranch, description: 'Native workflow graph builder with LangGraph export', source: 'core', status: 'built', defaultSize: { w: 1180, h: 760 } },
  { id: 'runner', label: 'Runner', icon: Play, description: 'Execute LangGraph workflows with live state & human-in-the-loop', source: 'core', status: 'built', defaultSize: { w: 1000, h: 680 } },
  { id: 'runs', label: 'Runs', icon: Activity, description: 'Native run traces — status, latency, tokens & timeline', source: 'core', status: 'built', defaultSize: { w: 1180, h: 760 } },
  { id: 'browser', label: 'Browser', icon: Bot, description: 'Fast CDP browser — accessibility tree, no vision cost, plus a login-capture mode', source: 'core', status: 'built', defaultSize: { w: 1100, h: 700 } },
  {
    id: 'video',
    label: 'Video Production',
    icon: Video,
    description: 'AI video studio — fps, sync, auto assists, render queue',
    source: 'core',
    status: 'built',
    defaultSize: { w: 1100, h: 720 },
    surfaceHints: { preferredOpen: 'floating', floatingDefaultSize: { w: 1100, h: 720 } },
  },
  {
    id: 'photography',
    label: 'Photography',
    icon: Camera,
    description: 'AI image studio — prompts, models, queue',
    source: 'core',
    status: 'built',
    defaultSize: { w: 960, h: 640 },
    surfaceHints: { preferredOpen: 'floating', floatingDefaultSize: { w: 960, h: 640 } },
  },
  { id: 'memory', label: 'Agent Memory', icon: Brain, description: 'Chroma vector memory — ingest/recall via visual workflows', source: 'core', status: 'built', defaultSize: { w: 720, h: 520 } },
  {
    id: 'agents',
    label: 'Agents',
    icon: UserCog,
    description: 'Agent registry — chat, persona, memory, tools',
    source: 'core',
    status: 'built',
    defaultSize: { w: 1100, h: 720 },
    surfaceHints: { preferredOpen: 'floating', floatingDefaultSize: { w: 1100, h: 720 } },
  },
  {
    id: 'media-library',
    label: 'Media Library',
    icon: Images,
    description: 'Agent media — upload, grid, filters, infinite scroll',
    source: 'core',
    status: 'built',
    defaultSize: { w: 960, h: 640 },
    surfaceHints: { preferredOpen: 'container', floatingDefaultSize: { w: 960, h: 640 } },
  },
];

export const ALL_TOOL_IDS: ToolId[] = TOOLS.map((tool) => tool.id);

/** Toolbar-eligible tools. Runner is embedded in the workflow studio instead. */
export const TOOLBAR_TOOL_IDS: ToolId[] = ALL_TOOL_IDS.filter((id) => id !== 'runner');

const UNKNOWN_TOOL_FALLBACK: ToolDef = {
  id: 'workflow',
  label: 'Unknown tool',
  icon: HelpCircle,
  description: 'This tool id no longer exists. It should have been migrated or removed upstream.',
  source: '',
  status: 'pending',
  defaultSize: { w: 400, h: 300 },
};

/**
 * Looks up a tool definition by id. Historically this silently fell back to
 * `TOOLS[0]` for any unknown id, which meant stale/removed tool ids from
 * persisted layouts (localStorage) would render as whatever tool happened to
 * be first in the array — e.g. after `team` was removed from the front of
 * `TOOLS`, every stale id silently rendered as the Workflow icon. Unknown ids
 * should be migrated/filtered out before reaching here (see
 * `lib/tool-id-migration.ts`); if one still shows up, fail loudly in
 * development and fall back to a clearly-labeled placeholder in production
 * instead of impersonating a real tool.
 */
export function getTool(toolId: ToolId): ToolDef {
  const tool = TOOLS.find((t) => t.id === toolId);
  if (tool) return tool;

  const message = `getTool(): unknown tool id "${toolId}" — it should have been migrated or filtered out before reaching getTool(). See lib/tool-id-migration.ts.`;
  if (process.env.NODE_ENV !== 'production') {
    throw new Error(message);
  }
  console.error(message);
  return UNKNOWN_TOOL_FALLBACK;
}
