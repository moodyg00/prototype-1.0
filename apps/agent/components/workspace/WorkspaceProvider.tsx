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
import { getVisibleCanvasRect, zoomCanvasAtCenter, screenToCanvasWorld } from '@/lib/canvas-coords';
import { createFloatingPanel, defaultPanelId, type PanelInstance } from '@/lib/panels';
import {
  defaultPaneForFeature,
  defaultStudioForFeature,
  featureHasStudio,
  featureOpensAsCanvasPane,
  findPaneDefinition,
  getFeatureCatalog,
  isFeatureMigrated,
  toolbarPaneWindowId,
} from '@/lib/pane-catalog';
import {
  insertPaneStackBelow,
  instantiateStudioTemplate,
  listInstanceIds,
  removePaneFromTree,
  updateSplitSizes,
} from '@/lib/panel-layout';
import {
  createInstanceId,
  type PaneInstance,
  type PaneSpan,
  type PaneWindowInstance,
  type SplitNode,
  type StudioInstance,
  type CanvasGroup,
  type CanvasWindowRef,
} from '@/lib/pane-types';
import {
  assignGroupId,
  collectGroupIdsFromSelection,
  dissolveCanvasGroups,
  groupBounds,
  isGroupVisibleInSelection,
  moveGroupByDelta,
  rectsIntersect,
  removeMemberFromGroups,
  resolveBounds,
  scaleGroupMembers,
  validateCanvasGroupSelection,
} from '@/lib/canvas-groups';
import { getTool, type ToolId } from '@/lib/tools';
import { computeChromeMetrics, findPanelSnapTarget, type ChromeMetrics } from '@/lib/chrome-layout';
import {
  addPanelContainerToLayout,
  addTooltipBarToLayout,
  moveChromeToSide,
  removePanelContainerFromLayout,
  removeTooltipBarFromLayout,
  reorderChromeOnSide,
} from '@/lib/workspace-mutations';
import {
  createBlankWorkspace,
  DOCKED_PANEL_SIZE,
  type PinSide,
  type WorkspaceLayout,
} from '@/lib/workspace-layout';
import { AGENT_NAVIGATE_EVENT, type AgentNavigateDetail, dispatchWorkflowDisposeScope, dispatchWorkflowLoadScope } from '@/lib/agent-navigation';

const PANE_WINDOW_SPAN_SIZE: Record<PaneSpan, { w: number; h: number }> = {
  third: { w: 340, h: 320 },
  half: { w: 460, h: 420 },
  full: { w: 620, h: 520 },
};

const BASE_Z = 20;
const DETACH_THRESHOLD = 20;

interface WorkspaceContextValue {
  layouts: WorkspaceLayout[];
  activeLayout: WorkspaceLayout;
  activeLayoutId: string;
  session: LayoutSession;
  hydrated: boolean;
  chromeMetrics: ChromeMetrics;
  switchWorkspace: (workspaceId: string) => void;
  createWorkspace: (name: string, description?: string) => void;
  resetActiveWorkspace: () => void;
  setDrawerOpen: (open: boolean) => void;
  setCanvasTransform: (canvas: LayoutSession['canvas']) => void;
  canvasZoomLocked: boolean;
  canvasPanLocked: boolean;
  toggleCanvasZoomLocked: () => void;
  toggleCanvasPanLocked: () => void;
  zoomCanvasIn: () => void;
  zoomCanvasOut: () => void;
  getBarTools: (barId: string) => ToolId[];
  handleBarToolClick: (barId: string, toolId: ToolId) => void;
  addToolToBar: (barId: string, toolId: ToolId) => void;
  removeToolFromBar: (barId: string, toolId: ToolId) => void;
  detachBarPanel: (barId: string, toolId: ToolId, x: number, y: number) => void;
  // Pane system (Panel slots)
  paneInstances: Record<string, PaneInstance>;
  getPanelPaneTree: (containerId: string) => SplitNode | null;
  addPaneToPanel: (containerId: string, featureId: ToolId, paneId: string) => void;
  closePaneInstance: (containerId: string, instanceId: string) => void;
  detachPaneToWindow: (containerId: string, instanceId: string, screenX: number, screenY: number) => void;
  reattachPaneWindow: (windowId: string, targetContainerId?: string) => void;
  reattachPaneWindowToStudio: (windowId: string, targetStudioId?: string) => void;
  trySnapPaneWindow: (windowId: string, screenX: number, screenY: number) => boolean;
  updatePanelTreeSizes: (containerId: string, path: number[], sizes: number[]) => void;
  paneWindows: PaneWindowInstance[];
  focusPaneWindow: (id: string) => void;
  closePaneWindow: (id: string) => void;
  minimizePaneWindow: (id: string) => void;
  movePaneWindow: (id: string, x: number, y: number) => void;
  resizePaneWindow: (id: string, w: number, h: number) => void;
  // Studios (multi-pane presets opened as one canvas Window)
  studioInstances: StudioInstance[];
  openStudio: (featureId: ToolId, studioId: string) => void;
  focusStudio: (id: string) => void;
  closeStudio: (id: string) => void;
  minimizeStudio: (id: string) => void;
  moveStudio: (id: string, x: number, y: number) => void;
  resizeStudio: (id: string, w: number, h: number) => void;
  updateStudioTreeSizes: (studioId: string, path: number[], sizes: number[]) => void;
  closeStudioPane: (studioId: string, instanceId: string) => void;
  detachStudioPaneToWindow: (studioId: string, instanceId: string, screenX: number, screenY: number) => void;
  floatingPanels: PanelInstance[];
  focusPanel: (id: string) => void;
  closePanel: (id: string) => void;
  minimizePanel: (id: string) => void;
  movePanel: (id: string, x: number, y: number) => void;
  resizePanel: (id: string, w: number, h: number) => void;
  getActiveBarTool: (barId: string) => ToolId | null;
  headerHeight: number;
  registerCanvasViewport: (node: HTMLDivElement | null) => void;
  screenToCanvasWorld: (screenX: number, screenY: number) => { x: number; y: number };
  layoutEditMode: boolean;
  setLayoutEditMode: (enabled: boolean) => void;
  addTooltipBar: (side: PinSide) => void;
  removeTooltipBar: (barId: string) => void;
  reorderTooltipBar: (barId: string, delta: -1 | 1) => void;
  moveTooltipBarToSide: (barId: string, side: PinSide) => void;
  addPanelContainer: (side: PinSide) => void;
  removePanelContainer: (containerId: string) => void;
  reorderPanelContainer: (containerId: string, delta: -1 | 1) => void;
  movePanelContainerToSide: (containerId: string, side: PinSide) => void;
  updatePanelContainerWidth: (containerId: string, width: number) => void;
  canvasGroups: CanvasGroup[];
  canvasSelection: CanvasWindowRef[];
  selectCanvasWindow: (ref: CanvasWindowRef, additive?: boolean) => void;
  clearCanvasSelection: () => void;
  selectWindowsInMarquee: (rect: { x: number; y: number; w: number; h: number }) => void;
  createCanvasGroupFromSelection: () => void;
  ungroupCanvasSelection: () => void;
  resizeCanvasGroup: (groupId: string, next: { x: number; y: number; w: number; h: number }) => void;
  isCanvasWindowSelected: (ref: CanvasWindowRef) => boolean;
  persistScopeWorkflowId: (scopeId: string, workflowId: string) => void;
  clearScopeWorkflowId: (scopeId: string) => void;
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
  const [layoutEditMode, setLayoutEditMode] = useState(false);
  const [canvasSelection, setCanvasSelection] = useState<CanvasWindowRef[]>([]);
  const maxZ = useRef(BASE_Z);
  const activeLayoutIdRef = useRef(activeLayoutId);
  const sessionRef = useRef(session);
  const canvasViewportRef = useRef<HTMLDivElement | null>(null);

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
  const activeLayoutRef = useRef(activeLayout);

  useEffect(() => {
    activeLayoutRef.current = activeLayout;
  }, [activeLayout]);

  const chromeMetrics = useMemo(
    () =>
      activeLayout
        ? computeChromeMetrics(activeLayout)
        : { leftWidth: 0, rightWidth: 0, topHeight: 0, bottomHeight: 0 },
    [activeLayout],
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

  const persistSession = useCallback(
    (next: LayoutSession) => {
      sessionRef.current = next;
      if (hydrated) {
        saveSession(activeLayoutIdRef.current, next);
      }
      return next;
    },
    [hydrated],
  );

  const toggleCanvasZoomLocked = useCallback(() => {
    setSession((prev) =>
      persistSession({ ...prev, canvasZoomLocked: !prev.canvasZoomLocked }),
    );
  }, [persistSession]);

  const toggleCanvasPanLocked = useCallback(() => {
    setSession((prev) =>
      persistSession({ ...prev, canvasPanLocked: !prev.canvasPanLocked }),
    );
  }, [persistSession]);

  const zoomCanvas = useCallback(
    (direction: 'in' | 'out') => {
      const node = canvasViewportRef.current;
      if (!node) return;
      const viewportRect = node.getBoundingClientRect();
      const visibleRect = getVisibleCanvasRect(viewportRect, chromeMetrics);
      setSession((prev) => {
        if (prev.canvasZoomLocked) return prev;
        return {
          ...prev,
          canvas: zoomCanvasAtCenter(prev.canvas, viewportRect, direction, visibleRect),
        };
      });
    },
    [chromeMetrics],
  );

  const zoomCanvasIn = useCallback(() => zoomCanvas('in'), [zoomCanvas]);
  const zoomCanvasOut = useCallback(() => zoomCanvas('out'), [zoomCanvas]);

  const registerCanvasViewport = useCallback((node: HTMLDivElement | null) => {
    canvasViewportRef.current = node;
  }, []);

  const screenToCanvasWorldFn = useCallback((screenX: number, screenY: number) => {
    const rect = canvasViewportRef.current?.getBoundingClientRect() ?? null;
    return screenToCanvasWorld(screenX, screenY, rect, sessionRef.current.canvas);
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

      const ref: CanvasWindowRef = { kind: 'floating-panel', id };
      const nextGroups = removeMemberFromGroups(prev.canvasGroups, ref);
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
        canvasGroups: nextGroups,
        barDetachedTools: nextDetached,
        barActiveTools: nextBarActive,
      };
    });
    setCanvasSelection((sel) => sel.filter((r) => !(r.kind === 'floating-panel' && r.id === id)));
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
    setSession((prev) => {
      const panel = prev.floatingPanels.find((p) => p.id === id);
      if (!panel) return prev;
      const dx = x - panel.x;
      const dy = y - panel.y;
      if (panel.groupId) {
        const group = prev.canvasGroups.find((g) => g.id === panel.groupId);
        if (group?.locked) {
          const moved = moveGroupByDelta(prev, group, dx, dy);
          return { ...prev, ...moved };
        }
      }
      return {
        ...prev,
        floatingPanels: prev.floatingPanels.map((p) => (p.id === id ? { ...p, x, y } : p)),
      };
    });
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

  const getActiveBarTool = useCallback(
    (barId: string) => (session.barActiveTools[barId] as ToolId | null | undefined) ?? null,
    [session.barActiveTools],
  );

  const openBarTool = useCallback((barId: string, toolId: ToolId) => {
    setSession((prev) => ({
      ...prev,
      barActiveTools: { ...prev.barActiveTools, [barId]: toolId },
    }));
  }, []);

  const openStudio = useCallback((featureId: ToolId, studioId: string, options?: { workflowId?: string }) => {
    const catalog = getFeatureCatalog(featureId);
    const preset = catalog.studios.find((s) => s.id === studioId);
    if (!preset) return;
    maxZ.current += 1;
    const { root, paneInstances } = instantiateStudioTemplate(preset.root, featureId);
    const w = 900;
    const h = 640;
    const viewportRect = canvasViewportRef.current?.getBoundingClientRect();
    const centerScreenX = viewportRect ? viewportRect.left + viewportRect.width / 2 : w / 2 + 160;
    const centerScreenY = viewportRect ? viewportRect.top + viewportRect.height / 2 : h / 2 + 120;
    const world = screenToCanvasWorldFn(centerScreenX, centerScreenY);
    const instanceId = `studio-${studioId}-${Date.now().toString(36)}`;
    setSession((prev) => {
      const sameFeatureCount = prev.studioInstances.filter((s) => s.featureId === featureId).length;
      const offset = sameFeatureCount * 32;
      const instance: StudioInstance = {
        id: instanceId,
        studioId,
        featureId,
        x: world.x - w / 2 + offset,
        y: world.y - h / 2 + offset,
        w,
        h,
        minimized: false,
        zIndex: maxZ.current,
        root,
        paneInstances,
      };
      return { ...prev, studioInstances: [...prev.studioInstances, instance] };
    });
    if (options?.workflowId && featureId === 'workflow') {
      queueMicrotask(() => dispatchWorkflowLoadScope(instanceId, options.workflowId!));
    }
  }, [screenToCanvasWorldFn]);

  const openPaneOnCanvas = useCallback((featureId: ToolId, options?: { paneId?: string }) => {
    const paneDef = options?.paneId
      ? findPaneDefinition(featureId, options.paneId)
      : defaultPaneForFeature(featureId);
    if (!paneDef) return;

    const windowId = toolbarPaneWindowId(featureId);
    maxZ.current += 1;
    const size = PANE_WINDOW_SPAN_SIZE[paneDef.defaultSpan ?? 'full'];
    const viewportRect = canvasViewportRef.current?.getBoundingClientRect();
    const centerScreenX = viewportRect ? viewportRect.left + viewportRect.width / 2 : size.w / 2 + 160;
    const centerScreenY = viewportRect ? viewportRect.top + viewportRect.height / 2 : size.h / 2 + 120;
    const world = screenToCanvasWorldFn(centerScreenX, centerScreenY);

    setSession((prev) => {
      const existing = prev.paneWindows.find((w) => w.id === windowId);
      if (existing) {
        return {
          ...prev,
          paneWindows: prev.paneWindows.map((w) =>
            w.id === windowId ? { ...w, zIndex: maxZ.current, minimized: false } : w,
          ),
        };
      }

      const sameFeatureCount = prev.paneWindows.filter((w) => w.featureId === featureId).length;
      const offset = sameFeatureCount * 32;
      const instanceId = createInstanceId(paneDef.id);
      const instance: PaneInstance = { instanceId, paneId: paneDef.id, featureId };
      const paneWindow: PaneWindowInstance = {
        id: windowId,
        instanceId,
        paneId: paneDef.id,
        featureId,
        x: world.x - size.w / 2 + offset,
        y: world.y - size.h / 2 + offset,
        w: size.w,
        h: size.h,
        minimized: false,
        zIndex: maxZ.current,
      };

      const nextBarActive = { ...prev.barActiveTools };
      for (const barId of Object.keys(nextBarActive)) {
        if (nextBarActive[barId] === featureId) nextBarActive[barId] = null;
      }

      return {
        ...prev,
        paneInstances: { ...prev.paneInstances, [instanceId]: instance },
        paneWindows: [...prev.paneWindows, paneWindow],
        barActiveTools: nextBarActive,
      };
    });
  }, [screenToCanvasWorldFn]);

  const handleBarToolClick = useCallback(
    (barId: string, toolId: ToolId) => {
      const studio = defaultStudioForFeature(toolId);
      if (studio) {
        openStudio(toolId, studio.id);
        return;
      }

      if (featureOpensAsCanvasPane(toolId)) {
        const windowId = toolbarPaneWindowId(toolId);
        const existing = sessionRef.current.paneWindows.find((w) => w.id === windowId);
        if (existing) {
          setSession((prev) => {
            const win = prev.paneWindows.find((w) => w.id === windowId);
            if (!win) return prev;
            const ref: CanvasWindowRef = { kind: 'pane-window', id: windowId };
            const nextGroups = removeMemberFromGroups(prev.canvasGroups, ref);
            const nextPaneInstances = { ...prev.paneInstances };
            delete nextPaneInstances[win.instanceId];
            return {
              ...prev,
              paneInstances: nextPaneInstances,
              paneWindows: prev.paneWindows.filter((w) => w.id !== windowId),
              canvasGroups: nextGroups,
              barActiveTools: { ...prev.barActiveTools, [barId]: null },
            };
          });
          setCanvasSelection((sel) => sel.filter((r) => !(r.kind === 'pane-window' && r.id === windowId)));
          return;
        }
        openPaneOnCanvas(toolId);
        return;
      }

      setSession((prev) => {
        const detached = prev.floatingPanels.find(
          (panel) => panel.barId === barId && panel.toolId === toolId && panel.detached,
        );
        const detachedPaneWin = prev.paneWindows.find(
          (win) => win.featureId === toolId && win.originBarId === barId,
        );
        const activeTool = (prev.barActiveTools[barId] as ToolId | null | undefined) ?? null;

        if (activeTool === toolId || detached || detachedPaneWin) {
          const nextPanels = detached
            ? prev.floatingPanels.filter((panel) => panel.id !== detached.id)
            : prev.floatingPanels;
          const nextPaneWindows = detachedPaneWin
            ? prev.paneWindows.filter((win) => win.id !== detachedPaneWin.id)
            : prev.paneWindows;
          const nextPaneInstances = { ...prev.paneInstances };
          if (detachedPaneWin) delete nextPaneInstances[detachedPaneWin.instanceId];
          const nextDetached = {
            ...prev.barDetachedTools,
            [barId]: (prev.barDetachedTools[barId] ?? []).filter((id) => id !== toolId),
          };
          return {
            ...prev,
            barActiveTools: { ...prev.barActiveTools, [barId]: null },
            floatingPanels: nextPanels,
            paneWindows: nextPaneWindows,
            paneInstances: nextPaneInstances,
            barDetachedTools: nextDetached,
          };
        }

        return {
          ...prev,
          barActiveTools: { ...prev.barActiveTools, [barId]: toolId },
        };
      });
    },
    [openStudio, openPaneOnCanvas],
  );

  const detachBarPanel = useCallback(
    (barId: string, toolId: ToolId, x: number, y: number) => {
      if (isFeatureMigrated(toolId)) {
        maxZ.current += 1;
        const layout = activeLayoutRef.current;
        const bar = layout?.tooltipBars.find((b) => b.id === barId);
        const containerId =
          layout?.panelContainers.find((c) => c.side === bar?.side)?.id ??
          layout?.panelContainers[0]?.id;
        const paneDef = defaultPaneForFeature(toolId);
        const size = PANE_WINDOW_SPAN_SIZE[paneDef.defaultSpan ?? 'full'];

        setSession((prev) => {
          const existing = prev.paneWindows.find(
            (win) => win.featureId === toolId && win.originBarId === barId,
          );
          if (existing) {
            return {
              ...prev,
              barActiveTools: { ...prev.barActiveTools, [barId]: null },
              barDetachedTools: {
                ...prev.barDetachedTools,
                [barId]: [...new Set([...(prev.barDetachedTools[barId] ?? []), toolId])],
              },
              paneWindows: prev.paneWindows.map((win) =>
                win.id === existing.id
                  ? { ...win, x, y, zIndex: maxZ.current, minimized: false }
                  : win,
              ),
            };
          }

          const instanceId = createInstanceId(paneDef.id);
          const instance: PaneInstance = { instanceId, paneId: paneDef.id, featureId: toolId };
          const paneWindow: PaneWindowInstance = {
            id: `pane-window-bar-${barId}-${toolId}`,
            instanceId,
            paneId: paneDef.id,
            featureId: toolId,
            x,
            y,
            w: size.w,
            h: size.h,
            minimized: false,
            zIndex: maxZ.current,
            originContainerId: containerId,
            originBarId: barId,
          };

          return {
            ...prev,
            paneInstances: { ...prev.paneInstances, [instanceId]: instance },
            paneWindows: [...prev.paneWindows, paneWindow],
            barActiveTools: { ...prev.barActiveTools, [barId]: null },
            barDetachedTools: {
              ...prev.barDetachedTools,
              [barId]: [...new Set([...(prev.barDetachedTools[barId] ?? []), toolId])],
            },
          };
        });
        return;
      }

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

  const removeToolFromBar = useCallback((barId: string, toolId: ToolId) => {
    const layoutId = activeLayoutIdRef.current;

    setSession((prev) => {
      const nextBarActive = { ...prev.barActiveTools };
      if (nextBarActive[barId] === toolId) {
        nextBarActive[barId] = null;
      }

      const removedPaneWins = prev.paneWindows.filter(
        (win) => win.originBarId === barId && win.featureId === toolId,
      );
      const nextPaneInstances = { ...prev.paneInstances };
      for (const win of removedPaneWins) {
        delete nextPaneInstances[win.instanceId];
      }

      return {
        ...prev,
        floatingPanels: prev.floatingPanels.filter(
          (panel) => !(panel.barId === barId && panel.toolId === toolId),
        ),
        paneWindows: prev.paneWindows.filter(
          (win) => !(win.originBarId === barId && win.featureId === toolId),
        ),
        paneInstances: nextPaneInstances,
        barActiveTools: nextBarActive,
        runtimeBarTools: {
          ...prev.runtimeBarTools,
          [barId]: (prev.runtimeBarTools[barId] ?? []).filter((id) => id !== toolId),
        },
        barDetachedTools: {
          ...prev.barDetachedTools,
          [barId]: (prev.barDetachedTools[barId] ?? []).filter((id) => id !== toolId),
        },
      };
    });

    setLayouts((prevLayouts) => {
      const nextLayouts = prevLayouts.map((layout) => {
        if (layout.id !== layoutId) return layout;
        return {
          ...layout,
          tooltipBars: layout.tooltipBars.map((bar) =>
            bar.id === barId
              ? { ...bar, tools: bar.tools.filter((id) => id !== toolId) }
              : bar,
          ),
        };
      });
      saveLayouts(nextLayouts);
      return nextLayouts;
    });
  }, []);

  // --- Pane system: Panel slots -------------------------------------------------

  const getPanelPaneTree = useCallback(
    (containerId: string) => session.panelPaneTrees[containerId] ?? null,
    [session.panelPaneTrees],
  );

  const addPaneToPanel = useCallback((containerId: string, featureId: ToolId, paneId: string) => {
    const definition = findPaneDefinition(featureId, paneId);
    const span = definition?.defaultSpan ?? 'full';
    const instanceId = createInstanceId(paneId);
    setSession((prev) => ({
      ...prev,
      paneInstances: {
        ...prev.paneInstances,
        [instanceId]: { instanceId, paneId, featureId },
      },
      panelPaneTrees: {
        ...prev.panelPaneTrees,
        [containerId]: insertPaneStackBelow(prev.panelPaneTrees[containerId] ?? null, instanceId, span),
      },
    }));
  }, []);

  const closePaneInstance = useCallback((containerId: string, instanceId: string) => {
    setSession((prev) => {
      const nextPaneInstances = { ...prev.paneInstances };
      delete nextPaneInstances[instanceId];
      return {
        ...prev,
        paneInstances: nextPaneInstances,
        panelPaneTrees: {
          ...prev.panelPaneTrees,
          [containerId]: removePaneFromTree(prev.panelPaneTrees[containerId] ?? null, instanceId),
        },
      };
    });
  }, []);

  const detachPaneToWindow = useCallback(
    (containerId: string, instanceId: string, screenX: number, screenY: number) => {
      maxZ.current += 1;
      const world = screenToCanvasWorldFn(screenX, screenY);
      setSession((prev) => {
        const instance = prev.paneInstances[instanceId];
        if (!instance) return prev;
        const definition = findPaneDefinition(instance.featureId, instance.paneId);
        const size = PANE_WINDOW_SPAN_SIZE[definition?.defaultSpan ?? 'full'];
        const paneWindow: PaneWindowInstance = {
          id: `pane-window-${instanceId}`,
          instanceId,
          paneId: instance.paneId,
          featureId: instance.featureId,
          x: world.x - size.w / 2,
          y: world.y - 20,
          w: size.w,
          h: size.h,
          minimized: false,
          zIndex: maxZ.current,
          originContainerId: containerId,
        };
        return {
          ...prev,
          panelPaneTrees: {
            ...prev.panelPaneTrees,
            [containerId]: removePaneFromTree(prev.panelPaneTrees[containerId] ?? null, instanceId),
          },
          paneWindows: [...prev.paneWindows.filter((w) => w.instanceId !== instanceId), paneWindow],
        };
      });
    },
    [screenToCanvasWorldFn],
  );

  const reattachPaneWindow = useCallback((windowId: string, targetContainerId?: string) => {
    setSession((prev) => {
      const win = prev.paneWindows.find((w) => w.id === windowId);
      if (!win) return prev;
      const containerId = targetContainerId ?? win.originContainerId ?? Object.keys(prev.panelPaneTrees)[0];
      if (!containerId) return prev;
      const definition = findPaneDefinition(win.featureId, win.paneId);
      const span = definition?.defaultSpan ?? 'full';
      return {
        ...prev,
        paneWindows: prev.paneWindows.filter((w) => w.id !== windowId),
        panelPaneTrees: {
          ...prev.panelPaneTrees,
          [containerId]: insertPaneStackBelow(prev.panelPaneTrees[containerId] ?? null, win.instanceId, span),
        },
      };
    });
  }, []);

  const reattachPaneWindowToStudio = useCallback((windowId: string, targetStudioId?: string) => {
    setSession((prev) => {
      const win = prev.paneWindows.find((w) => w.id === windowId);
      if (!win) return prev;
      const studioId = targetStudioId ?? win.originStudioId;
      if (!studioId) return prev;
      const instance = prev.paneInstances[win.instanceId];
      if (!instance) return prev;
      const definition = findPaneDefinition(win.featureId, win.paneId);
      const span = definition?.defaultSpan ?? 'full';
      const nextPaneInstances = { ...prev.paneInstances };
      delete nextPaneInstances[win.instanceId];
      return {
        ...prev,
        paneInstances: nextPaneInstances,
        paneWindows: prev.paneWindows.filter((w) => w.id !== windowId),
        studioInstances: prev.studioInstances.map((studio) => {
          if (studio.id !== studioId) return studio;
          return {
            ...studio,
            root: insertPaneStackBelow(studio.root, win.instanceId, span),
            paneInstances: { ...studio.paneInstances, [win.instanceId]: instance },
          };
        }),
      };
    });
  }, []);

  const trySnapPaneWindow = useCallback(
    (windowId: string, screenX: number, screenY: number): boolean => {
      const layout = activeLayoutRef.current;
      if (!layout) return false;
      const targetId = findPanelSnapTarget(
        layout,
        window.innerWidth,
        window.innerHeight,
        screenX,
        screenY,
        headerHeight,
      );
      if (!targetId) return false;
      reattachPaneWindow(windowId, targetId);
      return true;
    },
    [headerHeight, reattachPaneWindow],
  );

  const updatePanelTreeSizes = useCallback((containerId: string, path: number[], sizes: number[]) => {
    setSession((prev) => ({
      ...prev,
      panelPaneTrees: {
        ...prev.panelPaneTrees,
        [containerId]: updateSplitSizes(prev.panelPaneTrees[containerId] ?? null, path, sizes),
      },
    }));
  }, []);

  const focusPaneWindow = useCallback((id: string) => {
    maxZ.current += 1;
    setSession((prev) => ({
      ...prev,
      paneWindows: prev.paneWindows.map((w) => (w.id === id ? { ...w, zIndex: maxZ.current } : w)),
    }));
  }, []);

  const closePaneWindow = useCallback((id: string) => {
    setSession((prev) => {
      const win = prev.paneWindows.find((w) => w.id === id);
      if (!win) return prev;
      const ref: CanvasWindowRef = { kind: 'pane-window', id };
      const nextGroups = removeMemberFromGroups(prev.canvasGroups, ref);
      const nextPaneInstances = { ...prev.paneInstances };
      delete nextPaneInstances[win.instanceId];
      return {
        ...prev,
        paneInstances: nextPaneInstances,
        paneWindows: prev.paneWindows.filter((w) => w.id !== id),
        canvasGroups: nextGroups,
      };
    });
    setCanvasSelection((sel) => sel.filter((r) => !(r.kind === 'pane-window' && r.id === id)));
  }, []);

  const minimizePaneWindow = useCallback((id: string) => {
    setSession((prev) => ({
      ...prev,
      paneWindows: prev.paneWindows.map((w) => (w.id === id ? { ...w, minimized: !w.minimized } : w)),
    }));
  }, []);

  const movePaneWindow = useCallback((id: string, x: number, y: number) => {
    setSession((prev) => {
      const win = prev.paneWindows.find((w) => w.id === id);
      if (!win) return prev;
      const dx = x - win.x;
      const dy = y - win.y;
      if (win.groupId) {
        const group = prev.canvasGroups.find((g) => g.id === win.groupId);
        if (group?.locked) {
          const moved = moveGroupByDelta(prev, group, dx, dy);
          return { ...prev, ...moved };
        }
      }
      return {
        ...prev,
        paneWindows: prev.paneWindows.map((w) => (w.id === id ? { ...w, x, y } : w)),
      };
    });
  }, []);

  const resizePaneWindow = useCallback((id: string, w: number, h: number) => {
    setSession((prev) => ({
      ...prev,
      paneWindows: prev.paneWindows.map((win) => (win.id === id ? { ...win, w, h } : win)),
    }));
  }, []);

  // --- Studios: multi-pane presets opened as one canvas Window --------------------

  useEffect(() => {
    if (!activeLayout) return;

    const openTool = (toolId: ToolId, options?: { workflowId?: string; paneId?: string }) => {
      const studio = defaultStudioForFeature(toolId);
      if (studio) {
        openStudio(toolId, studio.id, options?.workflowId ? { workflowId: options.workflowId } : undefined);
        return;
      }
      if (featureOpensAsCanvasPane(toolId)) {
        openPaneOnCanvas(toolId, options?.paneId ? { paneId: options.paneId } : undefined);
        return;
      }
      for (const bar of activeLayout.tooltipBars) {
        const tools = mergeBarTools(activeLayout, sessionRef.current, bar.id);
        if (tools.includes(toolId)) {
          openBarTool(bar.id, toolId);
          return;
        }
      }
      const fallbackBar = activeLayout.tooltipBars[0]?.id ?? 'top';
      openBarTool(fallbackBar, toolId);
    };

    const onNav = (ev: Event) => {
      const detail = (ev as CustomEvent<AgentNavigateDetail>).detail;
      if (!detail?.toolId) return;

      if (detail.studioId) {
        const catalog = getFeatureCatalog(detail.toolId);
        if (catalog.studios.some((s) => s.id === detail.studioId)) {
          openStudio(detail.toolId, detail.studioId);
        }
        return;
      }

      if (detail.paneId) {
        if (detail.containerId) {
          addPaneToPanel(detail.containerId, detail.toolId, detail.paneId);
        } else {
          openPaneOnCanvas(detail.toolId, { paneId: detail.paneId });
        }
        return;
      }

      openTool(detail.toolId, { workflowId: detail.workflowId });
    };

    window.addEventListener(AGENT_NAVIGATE_EVENT, onNav);
    return () => window.removeEventListener(AGENT_NAVIGATE_EVENT, onNav);
  }, [activeLayout, openBarTool, addPaneToPanel, openStudio, openPaneOnCanvas]);

  const focusStudio = useCallback((id: string) => {
    maxZ.current += 1;
    setSession((prev) => ({
      ...prev,
      studioInstances: prev.studioInstances.map((s) => (s.id === id ? { ...s, zIndex: maxZ.current } : s)),
    }));
  }, []);

  const closeStudio = useCallback((id: string) => {
    const studio = sessionRef.current.studioInstances.find((s) => s.id === id);
    if (studio?.featureId === 'workflow') {
      dispatchWorkflowDisposeScope(id);
    }
    setSession((prev) => {
      const ref: CanvasWindowRef = { kind: 'studio', id };
      const nextGroups = removeMemberFromGroups(prev.canvasGroups, ref);
      let next = {
        ...prev,
        studioInstances: prev.studioInstances.filter((s) => s.id !== id),
        canvasGroups: nextGroups,
      };
      const scopeWorkflowIds = { ...prev.scopeWorkflowIds };
      delete scopeWorkflowIds[id];
      next = { ...next, scopeWorkflowIds };
      return next;
    });
    setCanvasSelection((sel) => sel.filter((r) => !(r.kind === 'studio' && r.id === id)));
  }, []);

  const minimizeStudio = useCallback((id: string) => {
    setSession((prev) => ({
      ...prev,
      studioInstances: prev.studioInstances.map((s) => (s.id === id ? { ...s, minimized: !s.minimized } : s)),
    }));
  }, []);

  const moveStudio = useCallback((id: string, x: number, y: number) => {
    setSession((prev) => {
      const studio = prev.studioInstances.find((s) => s.id === id);
      if (!studio) return prev;
      const dx = x - studio.x;
      const dy = y - studio.y;
      if (studio.groupId) {
        const group = prev.canvasGroups.find((g) => g.id === studio.groupId);
        if (group?.locked) {
          const moved = moveGroupByDelta(prev, group, dx, dy);
          return { ...prev, ...moved };
        }
      }
      return {
        ...prev,
        studioInstances: prev.studioInstances.map((s) => (s.id === id ? { ...s, x, y } : s)),
      };
    });
  }, []);

  const resizeStudio = useCallback((id: string, w: number, h: number) => {
    setSession((prev) => ({
      ...prev,
      studioInstances: prev.studioInstances.map((s) => (s.id === id ? { ...s, w, h } : s)),
    }));
  }, []);

  const updateStudioTreeSizes = useCallback((studioId: string, path: number[], sizes: number[]) => {
    setSession((prev) => ({
      ...prev,
      studioInstances: prev.studioInstances.map((s) =>
        s.id === studioId ? { ...s, root: updateSplitSizes(s.root, path, sizes) ?? s.root } : s,
      ),
    }));
  }, []);

  /** Closing a pane inside a Studio collapses its siblings to fill the freed space. */
  const closeStudioPane = useCallback((studioId: string, instanceId: string) => {
    setSession((prev) => ({
      ...prev,
      studioInstances: prev.studioInstances.map((s) => {
        if (s.id !== studioId) return s;
        const nextPaneInstances = { ...s.paneInstances };
        delete nextPaneInstances[instanceId];
        const nextRoot = removePaneFromTree(s.root, instanceId);
        return { ...s, root: nextRoot ?? s.root, paneInstances: nextPaneInstances };
      }),
    }));
  }, []);

  /** Tears a pane out of a Studio onto the canvas as its own Window; siblings collapse to fill. */
  const detachStudioPaneToWindow = useCallback(
    (studioId: string, instanceId: string, screenX: number, screenY: number) => {
      maxZ.current += 1;
      const world = screenToCanvasWorldFn(screenX, screenY);
      setSession((prev) => {
        const studio = prev.studioInstances.find((s) => s.id === studioId);
        const instance = studio?.paneInstances[instanceId];
        if (!studio || !instance) return prev;
        const definition = findPaneDefinition(instance.featureId, instance.paneId);
        const size = PANE_WINDOW_SPAN_SIZE[definition?.defaultSpan ?? 'full'];
        const win: PaneWindowInstance = {
          id: `pane-window-${instanceId}`,
          instanceId,
          paneId: instance.paneId,
          featureId: instance.featureId,
          x: world.x - size.w / 2,
          y: world.y - 20,
          w: size.w,
          h: size.h,
          minimized: false,
          zIndex: maxZ.current,
          originStudioId: studioId,
        };
        const nextStudioPaneInstances = { ...studio.paneInstances };
        delete nextStudioPaneInstances[instanceId];
        return {
          ...prev,
          paneInstances: { ...prev.paneInstances, [instanceId]: instance },
          paneWindows: [...prev.paneWindows.filter((w) => w.instanceId !== instanceId), win],
          studioInstances: prev.studioInstances.map((s) =>
            s.id === studioId
              ? { ...s, root: removePaneFromTree(s.root, instanceId) ?? s.root, paneInstances: nextStudioPaneInstances }
              : s,
          ),
        };
      });
    },
    [screenToCanvasWorldFn],
  );

  const updateActiveLayout = useCallback((updater: (layout: WorkspaceLayout) => WorkspaceLayout) => {
    const layoutId = activeLayoutIdRef.current;
    setLayouts((prevLayouts) => {
      const nextLayouts = prevLayouts.map((layout) =>
        layout.id === layoutId ? updater(layout) : layout,
      );
      saveLayouts(nextLayouts);
      return nextLayouts;
    });
  }, []);

  const addTooltipBar = useCallback(
    (side: PinSide) => updateActiveLayout((layout) => addTooltipBarToLayout(layout, side)),
    [updateActiveLayout],
  );

  const removeTooltipBar = useCallback((barId: string) => {
    updateActiveLayout((layout) => removeTooltipBarFromLayout(layout, barId));
    setSession((prev) => {
      const barActiveTools = { ...prev.barActiveTools };
      delete barActiveTools[barId];
      const runtimeBarTools = { ...prev.runtimeBarTools };
      delete runtimeBarTools[barId];
      const barDetachedTools = { ...prev.barDetachedTools };
      delete barDetachedTools[barId];
      return {
        ...prev,
        barActiveTools,
        runtimeBarTools,
        barDetachedTools,
        floatingPanels: prev.floatingPanels.filter((panel) => panel.barId !== barId),
      };
    });
  }, [updateActiveLayout]);

  const reorderTooltipBar = useCallback(
    (barId: string, delta: -1 | 1) => {
      updateActiveLayout((layout) => ({
        ...layout,
        tooltipBars: reorderChromeOnSide(layout.tooltipBars, barId, delta),
      }));
    },
    [updateActiveLayout],
  );

  const moveTooltipBarToSide = useCallback(
    (barId: string, side: PinSide) => {
      updateActiveLayout((layout) => ({
        ...layout,
        tooltipBars: moveChromeToSide(layout.tooltipBars, barId, side),
      }));
    },
    [updateActiveLayout],
  );

  const addPanelContainer = useCallback(
    (side: PinSide) => updateActiveLayout((layout) => addPanelContainerToLayout(layout, side)),
    [updateActiveLayout],
  );

  const removePanelContainer = useCallback((containerId: string) => {
    updateActiveLayout((layout) => removePanelContainerFromLayout(layout, containerId));
    setSession((prev) => {
      const containerOpenPanels = { ...prev.containerOpenPanels };
      delete containerOpenPanels[containerId];
      const runtimeContainerPanels = { ...prev.runtimeContainerPanels };
      delete runtimeContainerPanels[containerId];
      const panelPaneTrees = { ...prev.panelPaneTrees };
      const removedInstanceIds = new Set(listInstanceIds(panelPaneTrees[containerId] ?? null));
      delete panelPaneTrees[containerId];
      const paneInstances = { ...prev.paneInstances };
      for (const instanceId of removedInstanceIds) delete paneInstances[instanceId];
      return {
        ...prev,
        containerOpenPanels,
        runtimeContainerPanels,
        panelPaneTrees,
        paneInstances,
      };
    });
  }, [updateActiveLayout]);

  const reorderPanelContainer = useCallback(
    (containerId: string, delta: -1 | 1) => {
      updateActiveLayout((layout) => ({
        ...layout,
        panelContainers: reorderChromeOnSide(layout.panelContainers, containerId, delta),
      }));
    },
    [updateActiveLayout],
  );

  const movePanelContainerToSide = useCallback(
    (containerId: string, side: PinSide) => {
      updateActiveLayout((layout) => ({
        ...layout,
        panelContainers: moveChromeToSide(layout.panelContainers, containerId, side),
      }));
    },
    [updateActiveLayout],
  );

  const updatePanelContainerWidth = useCallback(
    (containerId: string, width: number) => {
      const clamped = Math.max(240, Math.min(720, Math.round(width)));
      updateActiveLayout((layout) => ({
        ...layout,
        panelContainers: layout.panelContainers.map((container) =>
          container.id === containerId ? { ...container, width: clamped } : container,
        ),
      }));
    },
    [updateActiveLayout],
  );

  const isCanvasWindowSelected = useCallback(
    (ref: CanvasWindowRef) => canvasSelection.some((r) => r.kind === ref.kind && r.id === ref.id),
    [canvasSelection],
  );

  const selectCanvasWindow = useCallback((ref: CanvasWindowRef, additive = false) => {
    setCanvasSelection((prev) => {
      const exists = prev.some((r) => r.kind === ref.kind && r.id === ref.id);
      if (exists) {
        return prev.filter((r) => !(r.kind === ref.kind && r.id === ref.id));
      }
      if (additive) return [...prev, ref];
      return [ref];
    });
  }, []);

  const clearCanvasSelection = useCallback(() => setCanvasSelection([]), []);

  const selectWindowsInMarquee = useCallback((rect: { x: number; y: number; w: number; h: number }) => {
    setSession((prev) => {
      const hits: CanvasWindowRef[] = [];
      for (const studio of prev.studioInstances) {
        if (rectsIntersect(resolveBounds({ kind: 'studio', id: studio.id }, prev.studioInstances, prev.paneWindows, prev.floatingPanels)!, rect)) {
          hits.push({ kind: 'studio', id: studio.id });
        }
      }
      for (const win of prev.paneWindows) {
        const b = resolveBounds({ kind: 'pane-window', id: win.id }, prev.studioInstances, prev.paneWindows, prev.floatingPanels);
        if (b && rectsIntersect(b, rect)) hits.push({ kind: 'pane-window', id: win.id });
      }
      for (const panel of prev.floatingPanels) {
        const b = resolveBounds({ kind: 'floating-panel', id: panel.id }, prev.studioInstances, prev.paneWindows, prev.floatingPanels);
        if (b && rectsIntersect(b, rect)) hits.push({ kind: 'floating-panel', id: panel.id });
      }
      setCanvasSelection(hits);
      return prev;
    });
  }, []);

  const createCanvasGroupFromSelection = useCallback(() => {
    const prev = sessionRef.current;
    const invalid = validateCanvasGroupSelection(
      canvasSelection,
      prev.studioInstances,
      prev.paneWindows,
      prev.floatingPanels,
    );
    if (invalid) return;

    const groupId = `group-${Date.now().toString(36)}`;
    const group: CanvasGroup = { id: groupId, members: [...canvasSelection], locked: true };
    setSession((session) => {
      const assigned = assignGroupId(session, canvasSelection, groupId);
      return {
        ...session,
        ...assigned,
        canvasGroups: [...session.canvasGroups, group],
      };
    });
  }, [canvasSelection]);

  const ungroupCanvasSelection = useCallback(() => {
    const prev = sessionRef.current;
    const groupIds = collectGroupIdsFromSelection(
      canvasSelection,
      prev.studioInstances,
      prev.paneWindows,
      prev.floatingPanels,
    );
    if (groupIds.size === 0) return;

    setSession((session) => ({
      ...session,
      ...dissolveCanvasGroups(session, groupIds),
    }));
  }, [canvasSelection]);

  const resizeCanvasGroup = useCallback(
    (groupId: string, nextBounds: { x: number; y: number; w: number; h: number }) => {
      setSession((prev) => {
        const group = prev.canvasGroups.find((g) => g.id === groupId);
        if (!group?.locked) return prev;
        const origin = groupBounds(group.members, prev.studioInstances, prev.paneWindows, prev.floatingPanels);
        if (!origin) return prev;
        const scaled = scaleGroupMembers(
          group.members,
          origin,
          nextBounds,
          prev.studioInstances,
          prev.paneWindows,
          prev.floatingPanels,
        );
        return { ...prev, ...scaled };
      });
    },
    [],
  );

  const persistScopeWorkflowId = useCallback((scopeId: string, workflowId: string) => {
    setSession((prev) => ({
      ...prev,
      scopeWorkflowIds: { ...prev.scopeWorkflowIds, [scopeId]: workflowId },
    }));
  }, []);

  const clearScopeWorkflowId = useCallback((scopeId: string) => {
    setSession((prev) => {
      const next = { ...prev.scopeWorkflowIds };
      delete next[scopeId];
      return { ...prev, scopeWorkflowIds: next };
    });
  }, []);

  const value: WorkspaceContextValue = {
    layouts,
    activeLayout: activeLayout ?? createBlankWorkspace('default', 'Default'),
    activeLayoutId,
    session,
    hydrated,
    chromeMetrics,
    switchWorkspace,
    createWorkspace,
    resetActiveWorkspace,
    setDrawerOpen,
    setCanvasTransform,
    canvasZoomLocked: session.canvasZoomLocked,
    canvasPanLocked: session.canvasPanLocked,
    toggleCanvasZoomLocked,
    toggleCanvasPanLocked,
    zoomCanvasIn,
    zoomCanvasOut,
    getBarTools,
    handleBarToolClick,
    addToolToBar,
    removeToolFromBar,
    detachBarPanel,
    paneInstances: session.paneInstances,
    getPanelPaneTree,
    addPaneToPanel,
    closePaneInstance,
    detachPaneToWindow,
    reattachPaneWindow,
    reattachPaneWindowToStudio,
    trySnapPaneWindow,
    updatePanelTreeSizes,
    paneWindows: session.paneWindows,
    focusPaneWindow,
    closePaneWindow,
    minimizePaneWindow,
    movePaneWindow,
    resizePaneWindow,
    studioInstances: session.studioInstances,
    openStudio,
    focusStudio,
    closeStudio,
    minimizeStudio,
    moveStudio,
    resizeStudio,
    updateStudioTreeSizes,
    closeStudioPane,
    detachStudioPaneToWindow,
    floatingPanels: session.floatingPanels,
    focusPanel,
    closePanel,
    minimizePanel,
    movePanel,
    resizePanel,
    getActiveBarTool,
    headerHeight,
    registerCanvasViewport,
    screenToCanvasWorld: screenToCanvasWorldFn,
    layoutEditMode,
    setLayoutEditMode,
    addTooltipBar,
    removeTooltipBar,
    reorderTooltipBar,
    moveTooltipBarToSide,
    addPanelContainer,
    removePanelContainer,
    reorderPanelContainer,
    movePanelContainerToSide,
    updatePanelContainerWidth,
    canvasGroups: session.canvasGroups,
    canvasSelection,
    selectCanvasWindow,
    clearCanvasSelection,
    selectWindowsInMarquee,
    createCanvasGroupFromSelection,
    ungroupCanvasSelection,
    resizeCanvasGroup,
    isCanvasWindowSelected,
    persistScopeWorkflowId,
    clearScopeWorkflowId,
  };

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export { DETACH_THRESHOLD };
export type { ChromeMetrics };