"use client";

import React, { useCallback } from 'react';
import { Rnd } from 'react-rnd';
import { Minus, X } from 'lucide-react';
import { ToolViewHost } from '@/components/tools/ToolViewHost';
import { PanelInstance } from '@/lib/panels';
import { getTool } from '@/lib/tools';

interface WorkspacePanelProps {
  panel: PanelInstance;
  scale: number;
  selected?: boolean;
  resizeLocked?: boolean;
  onSelect?: (additive: boolean) => void;
  onFocus: (id: string) => void;
  onClose: (id: string) => void;
  onMinimize: (id: string) => void;
  onResize: (id: string, w: number, h: number) => void;
  onMove: (id: string, x: number, y: number) => void;
}

export function WorkspacePanel({
  panel,
  scale,
  selected = false,
  resizeLocked = false,
  onSelect,
  onFocus,
  onClose,
  onMinimize,
  onResize,
  onMove,
}: WorkspacePanelProps) {
  const tool = getTool(panel.toolId);
  const Icon = tool.icon;

  const handleDrag = useCallback(
    (_: unknown, d: { x: number; y: number }) => {
      if (panel.groupId) onMove(panel.id, d.x, d.y);
    },
    [panel.groupId, panel.id, onMove],
  );

  const handleDragStop = useCallback(
    (_: unknown, d: { x: number; y: number }) => onMove(panel.id, d.x, d.y),
    [panel.id, onMove],
  );

  const handleResizeStop = useCallback(
    (_e: unknown, _dir: unknown, ref: HTMLElement) =>
      onResize(panel.id, ref.offsetWidth, ref.offsetHeight),
    [panel.id, onResize],
  );

  return (
    <Rnd
      position={{ x: panel.x, y: panel.y }}
      size={{ width: panel.w, height: panel.minimized ? 40 : panel.h }}
      minWidth={320}
      minHeight={panel.minimized ? 40 : 240}
      scale={scale}
      dragHandleClassName="panel-drag-handle"
      onDrag={panel.groupId ? handleDrag : undefined}
      onDragStop={handleDragStop}
      onResizeStop={handleResizeStop}
      onMouseDown={() => onFocus(panel.id)}
      style={{ zIndex: panel.zIndex, position: 'absolute' }}
      enableResizing={!panel.minimized && !resizeLocked}
      cancel=".panel-btn"
    >
      <div
        className={`panel-shell ${selected ? 'canvas-window-selected' : ''}`}
        style={{ height: '100%' }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div
          className={`panel-titlebar panel-drag-handle ${selected ? 'canvas-window-titlebar-selected' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            onSelect?.(e.shiftKey);
          }}
        >
          <div className="flex min-w-0 items-center gap-2">
            {selected ? <span className="canvas-window-selected-badge" aria-hidden /> : null}
            <Icon size={13} className="shrink-0 text-zinc-400" />
            <span className="truncate text-xs font-medium">{tool.label}</span>
          </div>
          <div className="ml-2 flex shrink-0 items-center gap-0.5">
            <button
              type="button"
              className="panel-btn"
              onClick={(e) => { e.stopPropagation(); onMinimize(panel.id); }}
              title="Minimize"
            >
              <Minus size={11} />
            </button>
            <button
              type="button"
              className="panel-btn panel-btn-close"
              onClick={(e) => { e.stopPropagation(); onClose(panel.id); }}
              title="Close"
            >
              <X size={11} />
            </button>
          </div>
        </div>
        {!panel.minimized ? (
          <div className="panel-body">
            <ToolViewHost toolId={panel.toolId} surface="floating" instanceId={panel.id} />
          </div>
        ) : null}
      </div>
    </Rnd>
  );
}