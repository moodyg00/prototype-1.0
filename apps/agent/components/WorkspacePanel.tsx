"use client";

import React, { useCallback } from 'react';
import { Rnd } from 'react-rnd';
import { Minus, X } from 'lucide-react';
import { PanelInstance } from '../lib/panels';
import { getWorkspace } from '../lib/workspaces';

interface WorkspacePanelProps {
  panel: PanelInstance;
  onFocus: (id: string) => void;
  onClose: (id: string) => void;
  onMinimize: (id: string) => void;
  onResize: (id: string, w: number, h: number) => void;
  onMove: (id: string, x: number, y: number) => void;
  children: React.ReactNode;
}

export function WorkspacePanel({
  panel, onFocus, onClose, onMinimize, onResize, onMove, children,
}: WorkspacePanelProps) {
  const workspace = getWorkspace(panel.workspaceId);
  const Icon = workspace.icon;

  const handleDragStop = useCallback(
    (_: unknown, d: { x: number; y: number }) => onMove(panel.id, d.x, d.y),
    [panel.id, onMove]
  );

  const handleResizeStop = useCallback(
    (_e: unknown, _dir: unknown, ref: HTMLElement) =>
      onResize(panel.id, ref.offsetWidth, ref.offsetHeight),
    [panel.id, onResize]
  );

  return (
    <Rnd
      position={{ x: panel.x, y: panel.y }}
      size={{ width: panel.w, height: panel.minimized ? 40 : panel.h }}
      minWidth={320}
      minHeight={panel.minimized ? 40 : 240}
      dragHandleClassName="panel-drag-handle"
      onDragStop={handleDragStop}
      onResizeStop={handleResizeStop}
      onMouseDown={() => onFocus(panel.id)}
      style={{ zIndex: panel.zIndex, position: 'absolute' }}
      enableResizing={!panel.minimized}
    >
      <div className="panel-shell" style={{ height: '100%' }}>
        <div className="panel-titlebar panel-drag-handle">
          <div className="flex items-center gap-2 min-w-0">
            <Icon size={13} className="text-zinc-400 flex-shrink-0" />
            <span className="text-xs font-medium truncate">{workspace.label}</span>
          </div>
          <div className="flex items-center gap-0.5 flex-shrink-0 ml-2">
            <button
              className="panel-btn"
              onClick={e => { e.stopPropagation(); onMinimize(panel.id); }}
              title="Minimize"
            >
              <Minus size={11} />
            </button>
            <button
              className="panel-btn panel-btn-close"
              onClick={e => { e.stopPropagation(); onClose(panel.id); }}
              title="Close"
            >
              <X size={11} />
            </button>
          </div>
        </div>
        {!panel.minimized && (
          <div className="panel-body">{children}</div>
        )}
      </div>
    </Rnd>
  );
}
