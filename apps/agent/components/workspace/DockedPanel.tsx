'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { chromeRectToStyle, getDockedPanelRect } from '@/lib/chrome-layout';
import { PaneHost } from '@/components/pane/PaneHost';
import { ToolViewHost } from '@/components/tools/ToolViewHost';
import { DETACH_THRESHOLD, useWorkspace } from '@/components/workspace/WorkspaceProvider';
import { defaultPaneForFeature, isFeatureMigrated } from '@/lib/pane-catalog';
import { getTool, type ToolId } from '@/lib/tools';
import type { PinSide } from '@/lib/workspace-layout';

export function DockedPanel({
  barId,
  barSide,
  toolId,
}: {
  barId: string;
  barSide: PinSide;
  toolId: ToolId;
}) {
  const { detachBarPanel, handleBarToolClick, activeLayout, screenToCanvasWorld } = useWorkspace();
  const tool = getTool(toolId);
  const Icon = tool.icon;
  const dragRef = useRef<{ x: number; y: number; active: boolean }>({ x: 0, y: 0, active: false });
  const [dragging, setDragging] = useState(false);
  const rect = getDockedPanelRect(activeLayout, barSide);
  const migrated = isFeatureMigrated(toolId);

  const dockedInstance = useMemo(
    () => ({
      instanceId: `docked-${barId}-${toolId}`,
      paneId: defaultPaneForFeature(toolId).id,
      featureId: toolId,
    }),
    [barId, toolId],
  );

  const onPointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    dragRef.current = { x: event.clientX, y: event.clientY, active: true };
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  }, []);

  const onPointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!dragRef.current.active) return;
      const dx = event.clientX - dragRef.current.x;
      const dy = event.clientY - dragRef.current.y;
      if (Math.hypot(dx, dy) >= DETACH_THRESHOLD) {
        dragRef.current.active = false;
        setDragging(false);
        event.currentTarget.releasePointerCapture(event.pointerId);
        const world = screenToCanvasWorld(event.clientX, event.clientY);
        detachBarPanel(barId, toolId, world.x - 160, world.y - 20);
      }
    },
    [barId, toolId, detachBarPanel, screenToCanvasWorld],
  );

  const onPointerUp = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    dragRef.current.active = false;
    setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }, []);

  return (
    <div
      style={{
        ...chromeRectToStyle(rect),
        background: '#111113',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 10,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 8px 40px rgba(0,0,0,0.45)',
      }}
      className={dragging ? 'opacity-90' : undefined}
    >
      <div
        className="panel-titlebar panel-drag-handle cursor-grab active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        <div className="flex min-w-0 items-center gap-2">
          <Icon size={13} className="shrink-0 text-zinc-400" />
          <span className="truncate text-xs font-medium">{tool.label}</span>
        </div>
        <button
          type="button"
          className="panel-btn panel-btn-close"
          onClick={() => handleBarToolClick(barId, toolId)}
          title="Close"
        >
          <X size={11} />
        </button>
      </div>
      <div className="panel-body min-h-0 flex-1">
        {migrated ? (
          <PaneHost
            instance={dockedInstance}
            placement="panel"
            showChrome={false}
            onClose={() => handleBarToolClick(barId, toolId)}
          />
        ) : (
          <ToolViewHost toolId={toolId} surface="docked" barId={barId} />
        )}
      </div>
    </div>
  );
}
