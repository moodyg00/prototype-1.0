'use client';

import React, { useCallback } from 'react';
import { Rnd } from 'react-rnd';

import { PaneHost } from '@/components/pane/PaneHost';
import type { PaneInstance, PaneWindowInstance } from '@/lib/pane-types';
import { getPaneWindowOrigin } from '@/lib/pane-types';

interface PaneWindowProps {
  paneWindow: PaneWindowInstance;
  instance: PaneInstance;
  scale: number;
  selected?: boolean;
  resizeLocked?: boolean;
  onSelect?: (additive: boolean) => void;
  onFocus: (id: string) => void;
  onClose: (id: string) => void;
  onMinimize: (id: string) => void;
  onResize: (id: string, w: number, h: number) => void;
  onMove: (id: string, x: number, y: number) => void;
  onReattachToPanel: (id: string) => void;
  onReattachToStudio: (id: string) => void;
  onDragEnd?: (screenX: number, screenY: number) => void;
}

/** Canvas Window for a Pane detached from a Panel or Studio — renders via PaneHost. */
export function PaneWindow({
  paneWindow,
  instance,
  scale,
  selected = false,
  resizeLocked = false,
  onSelect,
  onFocus,
  onClose,
  onMinimize,
  onResize,
  onMove,
  onReattachToPanel,
  onReattachToStudio,
  onDragEnd,
}: PaneWindowProps) {
  const origin = getPaneWindowOrigin(paneWindow);
  const dockTitle = origin?.kind === 'studio' ? 'Dock to studio' : 'Dock to panel';

  const handleDock = useCallback(() => {
    if (origin?.kind === 'studio') onReattachToStudio(paneWindow.id);
    else onReattachToPanel(paneWindow.id);
  }, [origin, onReattachToPanel, onReattachToStudio, paneWindow.id]);

  const handleDrag = useCallback(
    (_: unknown, d: { x: number; y: number }) => {
      if (paneWindow.groupId) onMove(paneWindow.id, d.x, d.y);
    },
    [paneWindow.groupId, paneWindow.id, onMove],
  );

  const handleDragStop = useCallback(
    (event: MouseEvent | TouchEvent, d: { x: number; y: number }) => {
      onMove(paneWindow.id, d.x, d.y);
      if (onDragEnd) {
        const point = 'clientX' in event ? event : event.changedTouches[0];
        if (point) onDragEnd(point.clientX, point.clientY);
      }
    },
    [paneWindow.id, onMove, onDragEnd],
  );

  const handleResizeStop = useCallback(
    (_e: unknown, _dir: unknown, ref: HTMLElement) => onResize(paneWindow.id, ref.offsetWidth, ref.offsetHeight),
    [paneWindow.id, onResize],
  );

  return (
    <Rnd
      position={{ x: paneWindow.x, y: paneWindow.y }}
      size={{ width: paneWindow.w, height: paneWindow.minimized ? 40 : paneWindow.h }}
      minWidth={260}
      minHeight={paneWindow.minimized ? 40 : 200}
      scale={scale}
      dragHandleClassName="panel-drag-handle"
      onDrag={paneWindow.groupId ? handleDrag : undefined}
      onDragStop={handleDragStop}
      onResizeStop={handleResizeStop}
      onMouseDown={() => onFocus(paneWindow.id)}
      style={{ zIndex: paneWindow.zIndex, position: 'absolute' }}
      enableResizing={!paneWindow.minimized && !resizeLocked}
      cancel=".panel-btn"
    >
      <div
        className={`panel-shell ${selected ? 'canvas-window-selected' : ''}`}
        style={{ height: '100%' }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <PaneHost
          instance={instance}
          placement="window"
          studioInstanceId={paneWindow.originStudioId}
          scopeId={paneWindow.originStudioId ?? `pane-window:${paneWindow.id}`}
          showChrome
          hideBody={paneWindow.minimized}
          onClose={() => onClose(paneWindow.id)}
          onDock={handleDock}
          dockTitle={dockTitle}
          onMinimize={() => onMinimize(paneWindow.id)}
          onTitlebarClick={(e) => {
            e.stopPropagation();
            onSelect?.(e.shiftKey);
          }}
        />
      </div>
    </Rnd>
  );
}
