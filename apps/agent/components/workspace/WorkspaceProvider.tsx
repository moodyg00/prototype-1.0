'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  createDefaultSession,
  createWorkspaceId,
  loadActiveWorkspaceId,
  loadLayouts,
  loadSession,
  resetSession,
  saveActiveWorkspaceId,
  saveLayouts,
  saveSession,
  type LayoutSession,
} from '@/lib/layout-store';
import { createFloatingPanel, defaultPanelId, type PanelInstance } from '@/lib/panels';
import { getTool, type ToolId } from '@/lib/tools';
import { computeInsets, type ViewportInsets } from '@/lib/chrome-layout';
import {
  createBlankWorkspace,
  DOCKED_PANEL_SIZE,
  type WorkspaceLayout,
} from '@/lib/workspace-layout';

const BASE_Z = 20;
const DETACH_THRESHOLD = 20;

interface WorkspaceContextValue {
  layouts: WorkspaceLayout[];
  activeLayout: WorkspaceLayout;
  activeLayoutId: string;
  session: LayoutSession;
  hydrated: boolean;
  insets: ViewportInsets;
  switchWorkspace: (workspaceId: string) => void;
  createWorkspace: (name: string, description?: string) => void;
  resetActiveWorkspace: () => void;
  setDrawerOpen: (open: boolean) => void;
  setCanvasTransform: (canvas: LayoutSession['canvas']) => void;
  getBarTools: (barId: string) => ToolId[];
  getContainerPanels: (containerId: string) => ToolId[];
  handleBarToolClick: (barId: string, toolId: ToolId) => void;
  addToolToBar: (barId: string, toolId: ToolId) => void;
  addPanelToContainer: (containerId: string, toolId: ToolId) => void;
  closeContainerPanel: (containerId: string, toolId: ToolId) => void;
  detachBarPanel: (barId: string, toolId: ToolId, x: number, y: number) => void;
  floatingPanels: PanelInstance[];
  focusPanel: (id: string) => void;
  closePanel: (id: string) => void;
  minimizePanel: (id: string) => void;
  movePanel: (id: string, x: number, y: number) => void;
  resizePanel: (id: string, w: number, h: number) => void;
  getActiveBarTool: (barId: string) => ToolId | null;
  headerHeight: number;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function useWorkspace(): WorkspaceContextValue {
  const value = useContext(WorkspaceContext);
  if (!value) throw new Error('useWorkspace must be used within WorkspaceProvider');
  return value;
}

function mergeBarTools(layout: WorkspaceLayout, session: LayoutSession, barId: string): ToolId[] {
  const preset = layout.tooltipBars.find((bar) => bar.id === barId)?.tools ?? [];
  const runtime = (session.runtimeBarTools[barId] ?? []) as ToolId[];
  return [...new Set([...preset, ...runtime])];
}

function mergeContainerPanels(layout: WorkspaceLayout, session: LayoutSession, containerId: string): ToolId[] {
  const preset = layout.panelContainers.find((c) => c.id === containerId)?.panels ?? [];
  const runtime = (session.runtimeContainerPanels[containerId] ?? []) as ToolId[];
  const open = (session.containerOpenPanels[containerId] ?? [...preset, ...runtime]) as ToolId[];
  return [...new Set(open)];
}

export function WorkspaceProvider({
  children,
  headerHeight = 56,
}: {
  children: React.ReactNode;
  headerHeight?: number;
}) {
  const [layouts, setLayouts] = useState<WorkspaceLayout[]>([]);
  const [activeLayoutId, setActiveLayoutId] = useState<string>('default');
  const [session, setSession] = useState<LayoutSession>(createDefaultSession(createBlankWorkspace('default', 'Default')));
  const [hydrated, setHydrated] = useState(false);
  const maxZ = useRef(BASE_Z);
  const activeLayoutIdRef = useRef(activeLayoutId);
  const sessionRef = useRef(session);

  useEffect(() => {
    activeLayoutIdRef.current = activeLayoutId;
  }, [activeLayoutId]);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  const activeLayout = useMemo(
    () => layouts.find((layout) => layout.id === activeLayoutId) ?? layouts[0],
    [layouts, activeLayoutId],
  );

  const insets = useMemo(
    () => (activeLayout ? computeInsets(activeLayout, headerHeight) : { top: headerHeight, left: 0, right: 0, bottom: 0 }),
    [activeLayout, headerHeight],
  );

  useEffect(() => {
    const loadedLayouts = loadLayouts();
    const activeId = loadActiveWorkspaceId();
    const layout = loadedLayouts.find((item) => item.id === activeId) ?? loadedLayouts[0];
    const loadedSession = loadSession(layout.id, layout);
    maxZ.current = BASE_Z + loadedSession.floatingPanels.length;
    setLayouts(loadedLayouts);
    setActiveLayoutId(layout.id);
    setSession(loadedSession);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || !activeLayout) return;
    saveSession(activeLayoutId, session);
  }, [session, hydrated, activeLayoutId, activeLayout]);

  const switchWorkspace = useCallback(
    (workspaceId: string) => {
      const currentId = activeLayoutIdRef.current;
      const currentLayout = layouts.find((layout) => layout.id === currentId);
      if (currentLayout) {
        saveSession(currentId, sessionRef.current);
      }

      const nextLayout = layouts.find((layout) => layout.id === workspaceId);
      if (!nextLayout) return;

      const nextSession = loadSession(workspaceId, nextLayout);
      maxZ.current = BASE_Z + nextSession.floatingPanels.length;
      setActiveLayoutId(workspaceId);
      saveActiveWorkspaceId(workspaceId);
      setSession(nextSession);
    },
    [layouts],
  );

  const createWorkspace = useCallback((name: string, description?: string) => {
    const id = createWorkspaceId(name);
    const layout = createBlankWorkspace(id, name, description);
    const nextLayouts = [...layouts, layout];
    setLayouts(nextLayouts);
    saveLayouts(nextLayouts);
    switchWorkspace(id);
  }, [layouts, switchWorkspace]);

  const resetActiveWorkspace = useCallback(() => {
    if (!activeLayout) return;
    const next = resetSession(activeLayout);
    maxZ.current = BASE_Z + next.floatingPanels.length;
    setSession(next);
  }, [activeLayout]);

  const setDrawerOpen = useCallback((open: boolean) => {
    setSession((prev) => ({ ...prev, drawerOpen: open }));
  }, []);

  const setCanvasTransform = useCallback((canvas: LayoutSession['canvas']) => {
    setSession((prev) => ({ ...prev, canvas }));
  }, []);

  const focusPanel = useCallback((id: string) => {
    maxZ.current += 1;
    setSession((prev) => ({
      ...prev,
      floatingPanels: prev.floatingPanels.map((panel) =>
        panel.id === id ? { ...panel, zIndex: maxZ.current } : panel,
      ),
    }));
  }, []);

  const closePanel = useCallback((id: string) => {
    setSession((prev) => {
      const target = prev.floatingPanels.find((panel) => panel.id === id);
      if (!target) return prev;

      const nextPanels = prev.floatingPanels.filter((panel) => panel.id !== id);
      const nextDetached = { ...prev.barDetachedTools };
      if (target.barId) {
        nextDetached[target.barId] = (nextDetached[target.barId] ?? []).filter((toolId) => toolId !== target.toolId);
      }

      const nextBarActive = { ...prev.barActiveTools };
      if (target.barId && nextBarActive[target.barId] === target.toolId) {
        nextBarActive[target.barId] = null;
      }

      return {
        ...prev,
        floatingPanels: nextPanels,
        barDetachedTools: nextDetached,
        barActiveTools: nextBarActive,
      };
    });
  }, []);

  const minimizePanel = useCallback((id: string) => {
    setSession((prev) => ({
      ...prev,
      floatingPanels: prev.floatingPanels.map((panel) =>
        panel.id === id ? { ...panel, minimized: !panel.minimized } : panel,
      ),
    }));
  }, []);

  const movePanel = useCallback((id: string, x: number, y: number) => {
    setSession((prev) => ({
      ...prev,
      floatingPanels: prev.floatingPanels.map((panel) =>
        panel.id === id ? { ...panel, x, y } : panel,
      ),
    }));
  }, []);

  const resizePanel = useCallback((id: string, w: number, h: number) => {
    setSession((prev) => ({
      ...prev,
      floatingPanels: prev.floatingPanels.map((panel) =>
        panel.id === id ? { ...panel, w, h } : panel,
      ),
    }));
  }, []);

  const getBarTools = useCallback(
    (barId: string) => (activeLayout ? mergeBarTools(activeLayout, session, barId) : []),
    [activeLayout, session],
  );

  const getContainerPanels = useCallback(
    (containerId: string) => (activeLayout ? mergeContainerPanels(activeLayout, session, containerId) : []),
    [activeLayout, session],
  );

  const getActiveBarTool = useCallback(
    (barId: string) => (session.barActiveTools[barId] as ToolId | null | undefined) ?? null,
    [session.barActiveTools],
  );

  const handleBarToolClick = useCallback((barId: string, toolId: ToolId) => {
    setSession((prev) => {
      const detached = prev.floatingPanels.find(
        (panel) => panel.barId === barId && panel.toolId === toolId && panel.detached,
      );
      const activeTool = (prev.barActiveTools[barId] as ToolId | null | undefined) ?? null;

      if (activeTool === toolId || detached) {
        const nextPanels = detached
          ? prev.floatingPanels.filter((panel) => panel.id !== detached.id)
          : prev.floatingPanels;
        const nextDetached = {
          ...prev.barDetachedTools,
          [barId]: (prev.barDetachedTools[barId] ?? []).filter((id) => id !== toolId),
        };
        return {
          ...prev,
          barActiveTools: { ...prev.barActiveTools, [barId]: null },
          floatingPanels: nextPanels,
          barDetachedTools: nextDetached,
        };
      }

      return {
        ...prev,
        barActiveTools: { ...prev.barActiveTools, [barId]: toolId },
      };
    });
  }, []);

  const detachBarPanel = useCallback(
    (barId: string, toolId: ToolId, x: number, y: number) => {
      const tool = getTool(toolId);
      maxZ.current += 1;
      const panelId = defaultPanelId(toolId, `${barId}-detached`);
      setSession((prev) => {
        const existing = prev.floatingPanels.find((panel) => panel.id === panelId);
        if (existing) {
          return {
            ...prev,
            barActiveTools: { ...prev.barActiveTools, [barId]: null },
            barDetachedTools: {
              ...prev.barDetachedTools,
              [barId]: [...new Set([...(prev.barDetachedTools[barId] ?? []), toolId])],
            },
            floatingPanels: prev.floatingPanels.map((panel) =>
              panel.id === panelId
                ? { ...panel, x, y, detached: true, zIndex: maxZ.current, minimized: false }
                : panel,
            ),
          };
        }

        const panel = createFloatingPanel(toolId, {
          id: panelId,
          x,
          y,
          w: Math.min(tool.defaultSize.w, DOCKED_PANEL_SIZE + 120),
          h: Math.min(tool.defaultSize.h, 520),
          zIndex: maxZ.current,
          source: 'bar',
          barId,
          detached: true,
        });

        return {
          ...prev,
          barActiveTools: { ...prev.barActiveTools, [barId]: null },
          barDetachedTools: {
            ...prev.barDetachedTools,
            [barId]: [...new Set([...(prev.barDetachedTools[barId] ?? []), toolId])],
          },
          floatingPanels: [...prev.floatingPanels, panel],
        };
      });
    },
    [],
  );

  const addToolToBar = useCallback((barId: string, toolId: ToolId) => {
    setSession((prev) => ({
      ...prev,
      runtimeBarTools: {
        ...prev.runtimeBarTools,
        [barId]: [...new Set([...(prev.runtimeBarTools[barId] ?? []), toolId])],
      },
    }));
  }, []);

  const addPanelToContainer = useCallback((containerId: string, toolId: ToolId) => {
    setSession((prev) => ({
      ...prev,
      runtimeContainerPanels: {
        ...prev.runtimeContainerPanels,
        [containerId]: [...new Set([...(prev.runtimeContainerPanels[containerId] ?? []), toolId])],
      },
      containerOpenPanels: {
        ...prev.containerOpenPanels,
        [containerId]: [...new Set([...(prev.containerOpenPanels[containerId] ?? []), toolId])],
      },
    }));
  }, []);

  const closeContainerPanel = useCallback((containerId: string, toolId: ToolId) => {
    setSession((prev) => ({
      ...prev,
      containerOpenPanels: {
        ...prev.containerOpenPanels,
        [containerId]: (prev.containerOpenPanels[containerId] ?? []).filter((id) => id !== toolId),
      },
    }));
  }, []);

  const value: WorkspaceContextValue = {
    layouts,
    activeLayout: activeLayout ?? createBlankWorkspace('default', 'Default'),
    activeLayoutId,
    session,
    hydrated,
    insets,
    switchWorkspace,
    createWorkspace,
    resetActiveWorkspace,
    setDrawerOpen,
    setCanvasTransform,
    getBarTools,
    getContainerPanels,
    handleBarToolClick,
    addToolToBar,
    addPanelToContainer,
    closeContainerPanel,
    detachBarPanel,
    floatingPanels: session.floatingPanels,
    focusPanel,
    closePanel,
    minimizePanel,
    movePanel,
    resizePanel,
    getActiveBarTool,
    headerHeight,
  };

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export { DETACH_THRESHOLD };
export type { ViewportInsets };