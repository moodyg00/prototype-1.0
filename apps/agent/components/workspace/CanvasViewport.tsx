'use client';

import { useEffect, useRef, useState } from 'react';
import { WorkspacePanel } from '@/components/WorkspacePanel';
import { PaneWindow } from '@/components/pane/PaneWindow';
import { StudioWindow } from '@/components/pane/StudioWindow';
import { CanvasGroupOverlay } from '@/components/workspace/CanvasGroupOverlay';
import { useWorkspace } from '@/components/workspace/WorkspaceProvider';
import {
  CANVAS_WORLD_CENTER,
  CANVAS_WORLD_SIZE,
} from '@/lib/canvas-coords';
import { isGroupVisibleInSelection } from '@/lib/canvas-groups';
import { cn } from '@/lib/utils';

function canStartCanvasGesture(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.closest('.panel-shell, .canvas-group-overlay')) return false;
  return target.classList.contains('canvas-viewport') || target.classList.contains('canvas-world');
}

export function CanvasViewport() {
  const {
    session,
    canvasPanLocked,
    setCanvasTransform,
    floatingPanels,
    focusPanel,
    closePanel,
    minimizePanel,
    movePanel,
    resizePanel,
    registerCanvasViewport,
    paneInstances,
    paneWindows,
    focusPaneWindow,
    closePaneWindow,
    minimizePaneWindow,
    movePaneWindow,
    resizePaneWindow,
    trySnapPaneWindow,
    reattachPaneWindow,
    reattachPaneWindowToStudio,
    studioInstances,
    focusStudio,
    closeStudio,
    minimizeStudio,
    moveStudio,
    resizeStudio,
    closeStudioPane,
    detachStudioPaneToWindow,
    updateStudioTreeSizes,
    canvasGroups,
    canvasSelection,
    selectCanvasWindow,
    clearCanvasSelection,
    selectWindowsInMarquee,
    isCanvasWindowSelected,
    resizeCanvasGroup,
    createCanvasGroupFromSelection,
    ungroupCanvasSelection,
    screenToCanvasWorld,
  } = useWorkspace();
  const ref = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const [panning, setPanning] = useState(false);
  const [marquee, setMarquee] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const panRef = useRef<{ active: boolean; x: number; y: number; originX: number; originY: number }>({
    active: false,
    x: 0,
    y: 0,
    originX: 0,
    originY: 0,
  });
  const marqueeRef = useRef<{ active: boolean; startX: number; startY: number; worldStartX: number; worldStartY: number }>({
    active: false,
    startX: 0,
    startY: 0,
    worldStartX: 0,
    worldStartY: 0,
  });

  useEffect(() => {
    registerCanvasViewport(ref.current);
    return () => registerCanvasViewport(null);
  }, [registerCanvasViewport]);

  // Center a fresh session on the middle of the virtual canvas so it feels
  // infinite from the start. Only runs once when the canvas is still at the
  // default origin with no pan/zoom applied (handles hydration timing).
  const centeredRef = useRef(false);
  useEffect(() => {
    if (centeredRef.current) return;
    const node = ref.current;
    if (!node) return;
    if (session.canvas.x !== 0 || session.canvas.y !== 0 || session.canvas.scale !== 1) {
      centeredRef.current = true;
      return;
    }
    const rect = node.getBoundingClientRect();
    setCanvasTransform({
      x: rect.width / 2 - CANVAS_WORLD_CENTER,
      y: rect.height / 2 - CANVAS_WORLD_CENTER,
      scale: 1,
    });
    centeredRef.current = true;
  }, [session.canvas, setCanvasTransform]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey)) return;
      const tag = (event.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (event.target as HTMLElement | null)?.isContentEditable) return;
      if (event.key.toLowerCase() === 'g' && event.shiftKey) {
        event.preventDefault();
        ungroupCanvasSelection();
      } else if (event.key.toLowerCase() === 'g') {
        event.preventDefault();
        createCanvasGroupFromSelection();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [createCanvasGroupFromSelection, ungroupCanvasSelection]);

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || !canStartCanvasGesture(event.target)) return;

    if (event.shiftKey) {
      const world = screenToCanvasWorld(event.clientX, event.clientY);
      marqueeRef.current = {
        active: true,
        startX: event.clientX,
        startY: event.clientY,
        worldStartX: world.x,
        worldStartY: world.y,
      };
      setMarquee({ x: world.x, y: world.y, w: 0, h: 0 });
      event.currentTarget.setPointerCapture(event.pointerId);
      return;
    }

    if (canvasPanLocked) return;
    clearCanvasSelection();
    panRef.current = {
      active: true,
      x: event.clientX,
      y: event.clientY,
      originX: session.canvas.x,
      originY: session.canvas.y,
    };
    setPanning(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (marqueeRef.current.active) {
      const world = screenToCanvasWorld(event.clientX, event.clientY);
      const x = Math.min(marqueeRef.current.worldStartX, world.x);
      const y = Math.min(marqueeRef.current.worldStartY, world.y);
      const w = Math.abs(world.x - marqueeRef.current.worldStartX);
      const h = Math.abs(world.y - marqueeRef.current.worldStartY);
      setMarquee({ x, y, w, h });
      return;
    }
    if (!panRef.current.active) return;
    const dx = event.clientX - panRef.current.x;
    const dy = event.clientY - panRef.current.y;
    setCanvasTransform({
      ...session.canvas,
      x: panRef.current.originX + dx,
      y: panRef.current.originY + dy,
    });
  };

  const onPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (marqueeRef.current.active) {
      if (marquee && marquee.w > 4 && marquee.h > 4) {
        selectWindowsInMarquee(marquee);
      }
      marqueeRef.current.active = false;
      setMarquee(null);
    }
    panRef.current.active = false;
    setPanning(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const isGroupLocked = (groupId?: string) =>
    Boolean(groupId && canvasGroups.find((g) => g.id === groupId)?.locked);

  const visibleGroups = canvasGroups.filter((group) => isGroupVisibleInSelection(group, canvasSelection));

  return (
    <div
      ref={ref}
      className={cn(
        'canvas-viewport canvas-layer absolute inset-0 overflow-hidden',
        panning && 'is-panning',
        canvasPanLocked && 'is-pan-locked cursor-default',
      )}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <div
        ref={worldRef}
        className="canvas-world relative"
        style={{
          width: CANVAS_WORLD_SIZE,
          height: CANVAS_WORLD_SIZE,
          transform: `translate(${session.canvas.x}px, ${session.canvas.y}px) scale(${session.canvas.scale})`,
          transformOrigin: '0 0',
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      >
        {visibleGroups.map((group) => (
          <CanvasGroupOverlay
            key={group.id}
            group={group}
            scale={session.canvas.scale}
            studios={studioInstances}
            paneWindows={paneWindows}
            floatingPanels={floatingPanels}
            onResize={resizeCanvasGroup}
          />
        ))}

        {marquee ? (
          <div
            className="pointer-events-none absolute border border-[rgba(57,255,20,0.55)] bg-[rgba(57,255,20,0.08)]"
            style={{ left: marquee.x, top: marquee.y, width: marquee.w, height: marquee.h, zIndex: 4 }}
          />
        ) : null}

        {floatingPanels.map((panel) => (
          <WorkspacePanel
            key={panel.id}
            panel={panel}
            scale={session.canvas.scale}
            selected={isCanvasWindowSelected({ kind: 'floating-panel', id: panel.id })}
            resizeLocked={isGroupLocked(panel.groupId)}
            onSelect={(additive) => selectCanvasWindow({ kind: 'floating-panel', id: panel.id }, additive)}
            onFocus={focusPanel}
            onClose={closePanel}
            onMinimize={minimizePanel}
            onMove={movePanel}
            onResize={resizePanel}
          />
        ))}

        {paneWindows.map((win) => {
          const instance = paneInstances[win.instanceId];
          if (!instance) return null;
          return (
            <PaneWindow
              key={win.id}
              paneWindow={win}
              instance={instance}
              scale={session.canvas.scale}
              selected={isCanvasWindowSelected({ kind: 'pane-window', id: win.id })}
              resizeLocked={isGroupLocked(win.groupId)}
              onSelect={(additive) => selectCanvasWindow({ kind: 'pane-window', id: win.id }, additive)}
              onFocus={focusPaneWindow}
              onClose={closePaneWindow}
              onMinimize={minimizePaneWindow}
              onMove={movePaneWindow}
              onResize={resizePaneWindow}
              onReattachToPanel={reattachPaneWindow}
              onReattachToStudio={reattachPaneWindowToStudio}
              onDragEnd={(screenX, screenY) => trySnapPaneWindow(win.id, screenX, screenY)}
            />
          );
        })}

        {studioInstances.map((studio) => (
          <StudioWindow
            key={studio.id}
            studio={studio}
            scale={session.canvas.scale}
            selected={isCanvasWindowSelected({ kind: 'studio', id: studio.id })}
            resizeLocked={isGroupLocked(studio.groupId)}
            onSelect={(additive) => selectCanvasWindow({ kind: 'studio', id: studio.id }, additive)}
            onFocus={focusStudio}
            onClose={closeStudio}
            onMinimize={minimizeStudio}
            onMove={moveStudio}
            onResize={resizeStudio}
            onClosePane={closeStudioPane}
            onDetachPane={detachStudioPaneToWindow}
            onLayout={updateStudioTreeSizes}
          />
        ))}
      </div>
    </div>
  );
}
