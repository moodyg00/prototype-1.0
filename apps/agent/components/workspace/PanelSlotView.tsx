'use client';

import { chromeRectToStyle, getContainerRect } from '@/lib/chrome-layout';
import { PaneLayoutHost } from '@/components/pane/PaneLayoutHost';
import { FeatureMenu } from '@/components/pane/FeatureMenu';
import { ChromeItemMenu } from '@/components/workspace/ChromeItemMenu';
import { useWorkspace } from '@/components/workspace/WorkspaceProvider';
import type { ToolId } from '@/lib/tools';
import { TOOLBAR_SIZE, type PanelContainerConfig, type PinSide } from '@/lib/workspace-layout';
import { cn } from '@/lib/utils';
import { useCallback, useRef } from 'react';

function PanelWidthHandle({
  side,
  onResize,
}: {
  side: PinSide;
  onResize: (delta: number) => void;
}) {
  const dragRef = useRef<{ x: number; y: number } | null>(null);

  const onPointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    dragRef.current = { x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
  }, []);

  const onPointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!dragRef.current) return;
      const dx = event.clientX - dragRef.current.x;
      const dy = event.clientY - dragRef.current.y;
      dragRef.current = { x: event.clientX, y: event.clientY };
      if (side === 'left') onResize(dx);
      else if (side === 'right') onResize(-dx);
      else if (side === 'top') onResize(dy);
      else onResize(-dy);
    },
    [onResize, side],
  );

  const onPointerUp = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    dragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }, []);

  const edgeClass =
    side === 'left'
      ? 'right-0 top-0 h-full w-1 cursor-ew-resize'
      : side === 'right'
        ? 'left-0 top-0 h-full w-1 cursor-ew-resize'
        : side === 'top'
          ? 'bottom-0 left-0 h-1 w-full cursor-ns-resize'
          : 'left-0 top-0 h-1 w-full cursor-ns-resize';

  return (
    <div
      className={cn('absolute z-10 hover:bg-violet-500/30', edgeClass)}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      title="Resize panel"
    />
  );
}

function PanelChromeRail({
  container,
  layoutEditMode,
  onAddPane,
  onOpenStudio,
}: {
  container: PanelContainerConfig;
  layoutEditMode: boolean;
  onAddPane: (featureId: ToolId, paneId: string) => void;
  onOpenStudio: (featureId: ToolId, studioId: string) => void;
}) {
  const isVerticalStack = container.side === 'left' || container.side === 'right';

  return (
    <div
      className={cn(
        'panel-container-rail flex shrink-0 gap-0.5',
        isVerticalStack
          ? 'items-center border-b border-white/8 px-2 py-2'
          : 'flex-col items-center border-r border-white/8 py-2',
      )}
      style={isVerticalStack ? undefined : { width: TOOLBAR_SIZE }}
    >
      <FeatureMenu onAddPane={onAddPane} onOpenStudio={onOpenStudio} />
      {layoutEditMode ? (
        <ChromeItemMenu kind="container" itemId={container.id} side={container.side} />
      ) : null}
    </div>
  );
}

/**
 * Panel slot: an edge-pinned host for a vertical stack of resizable Panes.
 * Replaces the old `PanelContainerView` card list — panes here render the same
 * component used in canvas Windows and Studio presets (see `PaneHost`).
 */
export function PanelSlotView({ container }: { container: PanelContainerConfig }) {
  const {
    getPanelPaneTree,
    addPaneToPanel,
    closePaneInstance,
    detachPaneToWindow,
    updatePanelTreeSizes,
    openStudio,
    paneInstances,
    activeLayout,
    layoutEditMode,
    updatePanelContainerWidth,
  } = useWorkspace();

  const root = getPanelPaneTree(container.id);
  const isVerticalStack = container.side === 'left' || container.side === 'right';
  const rect = getContainerRect(activeLayout, container.id);

  const handleResize = useCallback(
    (delta: number) => {
      updatePanelContainerWidth(container.id, container.width + delta);
    },
    [container.id, container.width, updatePanelContainerWidth],
  );

  if (!rect) return null;

  return (
    <div
      style={chromeRectToStyle(rect)}
      className={cn(
        'panel-container relative flex min-h-0 bg-[#0d0d0f]',
        isVerticalStack ? 'flex-col' : 'flex-row',
        layoutEditMode && 'ring-1 ring-inset ring-amber-500/30',
        container.side === 'left' && 'border-r border-white/10',
        container.side === 'right' && 'border-l border-white/10',
        container.side === 'top' && 'border-b border-white/10',
        container.side === 'bottom' && 'border-t border-white/10',
      )}
    >
      <PanelChromeRail
        container={container}
        layoutEditMode={layoutEditMode}
        onAddPane={(featureId, paneId) => addPaneToPanel(container.id, featureId, paneId)}
        onOpenStudio={(featureId, studioId) => openStudio(featureId, studioId)}
      />
      <div className="min-h-0 flex-1 overflow-hidden">
        <PaneLayoutHost
          root={root}
          instances={paneInstances}
          placement="panel"
          emptyState="Empty panel. Use + to add a pane."
          onClosePane={(instanceId) => closePaneInstance(container.id, instanceId)}
          onDetachPane={(instanceId, x, y) => detachPaneToWindow(container.id, instanceId, x, y)}
          onLayout={(path, sizes) => updatePanelTreeSizes(container.id, path, sizes)}
        />
      </div>
      {!layoutEditMode ? <PanelWidthHandle side={container.side} onResize={handleResize} /> : null}
    </div>
  );
}
