import { TOOLBAR_TOOL_IDS, type ToolId } from './tools';

export type WorkspaceId = string;
export type PinSide = 'top' | 'left' | 'right' | 'bottom';

export interface TooltipBarConfig {
  id: string;
  side: PinSide;
  tools: ToolId[];
}

export interface PanelContainerConfig {
  id: string;
  side: PinSide;
  width: number;
  panels: ToolId[];
}

export interface DefaultFloatingPanel {
  toolId: ToolId;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface WorkspaceLayout {
  id: WorkspaceId;
  name: string;
  description?: string;
  tooltipBars: TooltipBarConfig[];
  panelContainers: PanelContainerConfig[];
  drawerTools: ToolId[];
  defaultFloatingPanels: DefaultFloatingPanel[];
}

export const DEFAULT_WORKSPACE_ID = 'default';
export const PANEL_CONTAINER_WIDTH = 400;
export const TOOLBAR_SIZE = 40;
export const DOCKED_PANEL_SIZE = 320;

export function createDefaultWorkspace(): WorkspaceLayout {
  return {
    id: DEFAULT_WORKSPACE_ID,
    name: 'Default',
    description: 'Top nav tools, left bar empty, right panel container empty.',
    tooltipBars: [
      { id: 'top', side: 'top', tools: [...TOOLBAR_TOOL_IDS] },
      { id: 'left', side: 'left', tools: [] },
    ],
    panelContainers: [
      { id: 'right', side: 'right', width: PANEL_CONTAINER_WIDTH, panels: [] },
    ],
    drawerTools: [],
    defaultFloatingPanels: [],
  };
}

export function createBlankWorkspace(id: string, name: string, description?: string): WorkspaceLayout {
  return {
    id,
    name,
    description,
    tooltipBars: [],
    panelContainers: [],
    drawerTools: [],
    defaultFloatingPanels: [],
  };
}

/** Media-focused layout: wider right panel for library panes. */
export function createMediaStudioWorkspace(): WorkspaceLayout {
  return {
    id: 'media-studio',
    name: 'Media Studio',
    description: 'Wide right panel for media library panes and studios.',
    tooltipBars: [
      { id: 'top', side: 'top', tools: ['media-library', 'photography', 'video', 'workflow'] },
      { id: 'left', side: 'left', tools: [] },
    ],
    panelContainers: [{ id: 'right', side: 'right', width: 480, panels: [] }],
    drawerTools: [],
    defaultFloatingPanels: [],
  };
}

/** Ops desk: memory + runs in panel, workflow on canvas. */
export function createOpsDeskWorkspace(): WorkspaceLayout {
  return {
    id: 'ops-desk',
    name: 'Ops Desk',
    description: 'Memory and runs in the right panel; workflow tools on the top bar.',
    tooltipBars: [
      { id: 'top', side: 'top', tools: ['agents', 'workflow', 'runs', 'memory', 'browser'] },
      { id: 'left', side: 'left', tools: [] },
    ],
    panelContainers: [{ id: 'right', side: 'right', width: 420, panels: [] }],
    drawerTools: [],
    defaultFloatingPanels: [],
  };
}

/** Agents-first layout: console studio + memory on the bar. */
export function createAgentsDeskWorkspace(): WorkspaceLayout {
  return {
    id: 'agents-desk',
    name: 'Agents Desk',
    description: 'Agent registry studio, memory, and workflow on the top bar.',
    tooltipBars: [
      {
        id: 'top',
        side: 'top',
        tools: ['agents', 'memory', 'workflow', 'runs', 'media-library'],
      },
      { id: 'left', side: 'left', tools: [] },
    ],
    panelContainers: [{ id: 'right', side: 'right', width: 440, panels: [] }],
    drawerTools: [],
    defaultFloatingPanels: [],
  };
}

export function seedLayouts(): WorkspaceLayout[] {
  return [
    createDefaultWorkspace(),
    createMediaStudioWorkspace(),
    createOpsDeskWorkspace(),
    createAgentsDeskWorkspace(),
  ];
}