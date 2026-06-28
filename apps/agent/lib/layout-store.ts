import { createFloatingPanel, type PanelInstance } from './panels';
import {
  createDefaultWorkspace,
  DEFAULT_WORKSPACE_ID,
  seedLayouts,
  type WorkspaceId,
  type WorkspaceLayout,
} from './workspace-layout';

const LAYOUTS_KEY = 'agent-workspace-layouts';
const ACTIVE_KEY = 'agent-active-workspace';

function sessionKey(workspaceId: WorkspaceId): string {
  return `agent-layout-session:${workspaceId}`;
}

export interface LayoutSession {
  floatingPanels: PanelInstance[];
  barActiveTools: Record<string, string | null>;
  barDetachedTools: Record<string, string[]>;
  containerOpenPanels: Record<string, string[]>;
  runtimeBarTools: Record<string, string[]>;
  runtimeContainerPanels: Record<string, string[]>;
  drawerOpen: boolean;
  canvas: { x: number; y: number; scale: number };
}

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

export function createDefaultSession(layout: WorkspaceLayout): LayoutSession {
  const floatingPanels = layout.defaultFloatingPanels.map((panel, index) =>
    createFloatingPanel(panel.toolId, {
      x: panel.x,
      y: panel.y,
      w: panel.w,
      h: panel.h,
      zIndex: 10 + index,
      source: 'floating',
    }),
  );

  const containerOpenPanels: Record<string, string[]> = {};
  for (const container of layout.panelContainers) {
    containerOpenPanels[container.id] = [...container.panels];
  }

  return {
    floatingPanels,
    barActiveTools: {},
    barDetachedTools: {},
    containerOpenPanels,
    runtimeBarTools: {},
    runtimeContainerPanels: {},
    drawerOpen: false,
    canvas: { x: 0, y: 0, scale: 1 },
  };
}

export function loadLayouts(): WorkspaceLayout[] {
  if (!isBrowser()) return seedLayouts();
  try {
    const raw = localStorage.getItem(LAYOUTS_KEY);
    if (!raw) {
      const seeded = seedLayouts();
      saveLayouts(seeded);
      return seeded;
    }
    const parsed = JSON.parse(raw) as WorkspaceLayout[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      const seeded = seedLayouts();
      saveLayouts(seeded);
      return seeded;
    }
    const hasDefault = parsed.some((layout) => layout.id === DEFAULT_WORKSPACE_ID);
    return hasDefault ? parsed : [createDefaultWorkspace(), ...parsed];
  } catch {
    const seeded = seedLayouts();
    saveLayouts(seeded);
    return seeded;
  }
}

export function saveLayouts(layouts: WorkspaceLayout[]): void {
  if (!isBrowser()) return;
  localStorage.setItem(LAYOUTS_KEY, JSON.stringify(layouts));
}

export function loadActiveWorkspaceId(): WorkspaceId {
  if (!isBrowser()) return DEFAULT_WORKSPACE_ID;
  return localStorage.getItem(ACTIVE_KEY) ?? DEFAULT_WORKSPACE_ID;
}

export function saveActiveWorkspaceId(workspaceId: WorkspaceId): void {
  if (!isBrowser()) return;
  localStorage.setItem(ACTIVE_KEY, workspaceId);
}

export function loadSession(workspaceId: WorkspaceId, layout: WorkspaceLayout): LayoutSession {
  if (!isBrowser()) return createDefaultSession(layout);
  try {
    const raw = localStorage.getItem(sessionKey(workspaceId));
    if (!raw) return createDefaultSession(layout);
    const parsed = JSON.parse(raw) as LayoutSession;
    return {
      ...createDefaultSession(layout),
      ...parsed,
      canvas: parsed.canvas ?? { x: 0, y: 0, scale: 1 },
    };
  } catch {
    return createDefaultSession(layout);
  }
}

export function saveSession(workspaceId: WorkspaceId, session: LayoutSession): void {
  if (!isBrowser()) return;
  localStorage.setItem(sessionKey(workspaceId), JSON.stringify(session));
}

export function resetSession(layout: WorkspaceLayout): LayoutSession {
  const session = createDefaultSession(layout);
  if (isBrowser()) {
    localStorage.setItem(sessionKey(layout.id), JSON.stringify(session));
  }
  return session;
}

export function createWorkspaceId(name: string): WorkspaceId {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `${slug || 'workspace'}-${Date.now().toString(36)}`;
}