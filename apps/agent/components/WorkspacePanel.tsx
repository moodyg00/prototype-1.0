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
  onFocus: (id: string) => void;
  onClose: (id: string) => void;
  onMinimize: (id: string) => void;
  onResize: (id: string, w: number, h: number) => void;
  onMove: (id: string, x: number, y: number) => void;
}

export function WorkspacePanel({
  panel,
  scale,
  onFocus,
  onClose,
  onMinimize,
  onResize,
  onMove,
}: WorkspacePanelProps) {
  const tool = getTool(panel.toolId);
  const Icon = tool.icon;

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
      onDragStop={handleDragStop}
      onResizeStop={handleResizeStop}
      onMouseDown={() => onFocus(panel.id)}
      style={{ zIndex: panel.zIndex, position: 'absolute' }}
      enableResizing={!panel.minimized}
      cancel=".panel-btn"
    >
      <div className="panel-shell" style={{ height: '100%' }}>
        <div className="panel-titlebar panel-drag-handle">
          <div className="flex min-w-0 items-center gap-2">
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