import { createFloatingPanel, type PanelInstance } from './panels';
import {
  createDefaultWorkspace,
  DEFAULT_WORKSPACE_ID,
  PANEL_CONTAINER_WIDTH,
  seedLayouts,
  type WorkspaceId,
  type WorkspaceLayout,
} from './workspace-layout';

function migrateLayout(layout: WorkspaceLayout): WorkspaceLayout {
  return {
    ...layout,
    panelContainers: layout.panelContainers.map((container) => ({
      ...container,
      width:
        container.width === undefined || container.width === 300
          ? PANEL_CONTAINER_WIDTH
          : container.width,
    })),
  };
}

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
  canvasZoomLocked: boolean;
  canvasPanLocked: boolean;
}

type PersistedSession = Partial<LayoutSession> & { canvasLocked?: boolean };

function resolveCanvasLockFlags(parsed: PersistedSession): {
  canvasZoomLocked: boolean;
  canvasPanLocked: boolean;
} {
  const legacyLocked = parsed.canvasLocked === true;
  return {
    canvasZoomLocked:
      parsed.canvasZoomLocked === true ||
      (parsed.canvasZoomLocked === undefined && legacyLocked),
    canvasPanLocked:
      parsed.canvasPanLocked === true ||
      (parsed.canvasPanLocked === undefined && legacyLocked),
  };
}

function getLayoutCanvasDefaults(): LayoutSession['canvas'] {
  return { x: 0, y: 0, scale: 1 };
}

function mergePersistedSession(layout: WorkspaceLayout, parsed: PersistedSession): LayoutSession {
  const defaults = createDefaultSession(layout);
  const lockFlags = resolveCanvasLockFlags(parsed);
  return {
    ...defaults,
    ...parsed,
    canvas: parsed.canvas ?? defaults.canvas,
    canvasZoomLocked: lockFlags.canvasZoomLocked,
    canvasPanLocked: lockFlags.canvasPanLocked,
  };
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
    canvas: getLayoutCanvasDefaults(),
    canvasZoomLocked: false,
    canvasPanLocked: false,
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
    const parsed = (JSON.parse(raw) as WorkspaceLayout[]).map(migrateLayout);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      const seeded = seedLayouts();
      saveLayouts(seeded);
      return seeded;
    }
    const hasDefault = parsed.some((layout) => layout.id === DEFAULT_WORKSPACE_ID);
    const layouts = hasDefault ? parsed : [createDefaultWorkspace(), ...parsed];
    saveLayouts(layouts);
    return layouts;
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
    const parsed = JSON.parse(raw) as PersistedSession;
    return mergePersistedSession(layout, parsed);
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