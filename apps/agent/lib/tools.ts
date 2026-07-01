import {
  Activity,
  BarChart3,
  Bot,
  Brain,
  FileText,
  GitBranch,
  Globe,
  Image as ImageIcon,
  Play,
  Smartphone,
  Terminal,
  Users,
  Video,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ToolSurface } from './tool-surfaces';

export type ToolId =
  | 'team'
  | 'workflow'
  | 'runner'
  | 'runs'
  | 'browser'
  | 'visual-browser'
  | 'pure-browser'
  | 'video'
  | 'photography'
  | 'memory'
  | 'agents'
  | 'media-library'
  | 'documents'
  | 'analytics'
  | 'mobile'
  | 'website';

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
  { id: 'team', label: 'Team', icon: Users, description: 'Executive meeting interface', source: 'core', status: 'built', defaultSize: { w: 1180, h: 760 } },
  { id: 'workflow', label: 'Workflow', icon: GitBranch, description: 'Native workflow graph builder with LangGraph export', source: 'core', status: 'built', defaultSize: { w: 1180, h: 760 } },
  { id: 'runner', label: 'Runner', icon: Play, description: 'Execute LangGraph workflows with live state & human-in-the-loop', source: 'core', status: 'built', defaultSize: { w: 1000, h: 680 } },
  { id: 'runs', label: 'Runs', icon: Activity, description: 'Native run traces — status, latency, tokens & timeline', source: 'core', status: 'built', defaultSize: { w: 1180, h: 760 } },
  { id: 'browser', label: 'Browser', icon: Bot, description: 'Unified browser — visual, headless, and login modes share one panel', source: 'core', status: 'built', defaultSize: { w: 1100, h: 700 } },
  { id: 'pure-browser', label: 'Pure Browser', icon: Terminal, description: 'Fast CDP browser — accessibility tree, no vision cost', source: 'core', status: 'built', defaultSize: { w: 900, h: 600 } },
  { id: 'visual-browser', label: 'Visual Browser', icon: Bot, description: 'Visual-first browser operator', source: 'core', status: 'built', defaultSize: { w: 1100, h: 700 } },
  { id: 'video', label: 'Video Production', icon: Video, description: 'Agentic video (Montage blueprint)', source: 'calesthio/OpenMontage', status: 'pending', defaultSize: { w: 640, h: 420 } },
  {
    id: 'photography',
    label: 'Photography',
    icon: ImageIcon,
    description: 'AI image studio — prompts, models, queue',
    source: 'core',
    status: 'built',
    defaultSize: { w: 960, h: 640 },
    surfaceHints: { preferredOpen: 'floating', floatingDefaultSize: { w: 960, h: 640 } },
  },
  { id: 'memory', label: 'Agent Memory', icon: Brain, description: 'Chroma vector memory — ingest/recall via visual workflows', source: 'core', status: 'built', defaultSize: { w: 720, h: 520 } },
  { id: 'agents', label: 'Agents', icon: Brain, description: 'Agent registry and configuration', source: '', status: 'pending', defaultSize: { w: 560, h: 380 } },
  {
    id: 'media-library',
    label: 'Media Library',
    icon: ImageIcon,
    description: 'Agent media — upload, grid, filters, infinite scroll',
    source: 'core',
    status: 'built',
    defaultSize: { w: 960, h: 640 },
    surfaceHints: { preferredOpen: 'container', floatingDefaultSize: { w: 960, h: 640 } },
  },
  { id: 'documents', label: 'Documents', icon: FileText, description: 'PDF tools (Stirling-PDF blueprint)', source: 'Stirling-Tools/Stirling-PDF', status: 'pending', defaultSize: { w: 560, h: 380 } },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, description: 'Custom analytics (Umami blueprint)', source: 'umami-software/umami', status: 'pending', defaultSize: { w: 720, h: 500 } },
  { id: 'mobile', label: 'Mobile', icon: Smartphone, description: 'Mobile device control via MCP', source: 'mobile-next/mobile-mcp', status: 'pending', defaultSize: { w: 560, h: 400 } },
  { id: 'website', label: 'Website', icon: Globe, description: 'Website management', source: '', status: 'pending', defaultSize: { w: 560, h: 380 } },
];

export const ALL_TOOL_IDS: ToolId[] = TOOLS.map((tool) => tool.id);

export function getTool(toolId: ToolId): ToolDef {
  return TOOLS.find((tool) => tool.id === toolId) ?? TOOLS[0];
}