'use client';

import { Minus, Sparkles, X } from 'lucide-react';
import { useCallback } from 'react';
import { Rnd } from 'react-rnd';

import { PaneLayoutHost } from '@/components/pane/PaneLayoutHost';
import { getFeatureCatalog } from '@/lib/pane-catalog';
import type { StudioInstance } from '@/lib/pane-types';
import { getTool } from '@/lib/tools';

interface StudioWindowProps {
  studio: StudioInstance;
  scale: number;
  selected?: boolean;
  resizeLocked?: boolean;
  onSelect?: (additive: boolean) => void;
  onFocus: (id: string) => void;
  onClose: (id: string) => void;
  onMinimize: (id: string) => void;
  onResize: (id: string, w: number, h: number) => void;
  onMove: (id: string, x: number, y: number) => void;
  onClosePane: (studioId: string, instanceId: string) => void;
  onDetachPane: (studioId: string, instanceId: string, screenX: number, screenY: number) => void;
  onLayout: (studioId: string, path: number[], sizes: number[]) => void;
}

/**
 * Floating canvas Window hosting a Studio preset's split tree. Tearing a pane out
 * (drag past the threshold in its titlebar) collapses the remaining siblings to fill,
 * same as detaching a pane out of a Panel slot.
 */
export function StudioWindow({
  studio,
  scale,
  selected = false,
  resizeLocked = false,
  onSelect,
  onFocus,
  onClose,
  onMinimize,
  onResize,
  onMove,
  onClosePane,
  onDetachPane,
  onLayout,
}: StudioWindowProps) {
  const tool = getTool(studio.featureId);
  const Icon = tool.icon;
  const catalog = getFeatureCatalog(studio.featureId);
  const preset = catalog.studios.find((s) => s.id === studio.studioId);
  const label = preset?.label ? `${catalog.label} · ${preset.label}` : catalog.label;

  const handleDrag = useCallback(
    (_: unknown, d: { x: number; y: number }) => {
      if (studio.groupId) onMove(studio.id, d.x, d.y);
    },
    [studio.groupId, studio.id, onMove],
  );

  const handleDragStop = useCallback(
    (_: unknown, d: { x: number; y: number }) => onMove(studio.id, d.x, d.y),
    [studio.id, onMove],
  );

  const handleResizeStop = useCallback(
    (_e: unknown, _dir: unknown, ref: HTMLElement) => onResize(studio.id, ref.offsetWidth, ref.offsetHeight),
    [studio.id, onResize],
  );

  return (
    <Rnd
      position={{ x: studio.x, y: studio.y }}
      size={{ width: studio.w, height: studio.minimized ? 40 : studio.h }}
      minWidth={480}
      minHeight={studio.minimized ? 40 : 320}
      scale={scale}
      dragHandleClassName="panel-drag-handle"
      onDrag={studio.groupId ? handleDrag : undefined}
      onDragStop={handleDragStop}
      onResizeStop={handleResizeStop}
      onMouseDown={() => onFocus(studio.id)}
      style={{ zIndex: studio.zIndex, position: 'absolute' }}
      enableResizing={!studio.minimized && !resizeLocked}
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
            if (onSelect) {
              e.stopPropagation();
              onSelect(e.shiftKey);
            }
          }}
        >
          <div className="flex min-w-0 items-center gap-2">
            {selected ? <span className="canvas-window-selected-badge" aria-hidden /> : null}
            <Sparkles size={12} className="shrink-0 text-violet-400" />
            <Icon size={13} className="shrink-0 text-zinc-400" />
            <span className="truncate text-xs font-medium">{label}</span>
          </div>
          <div className="ml-2 flex shrink-0 items-center gap-0.5">
            <button
              type="button"
              className="panel-btn"
              onClick={(e) => { e.stopPropagation(); onMinimize(studio.id); }}
              title="Minimize"
            >
              <Minus size={11} />
            </button>
            <button
              type="button"
              className="panel-btn panel-btn-close"
              onClick={(e) => { e.stopPropagation(); onClose(studio.id); }}
              title="Close studio"
            >
              <X size={11} />
            </button>
          </div>
        </div>
        {!studio.minimized ? (
          <div className="panel-body min-h-0 flex-1">
            <PaneLayoutHost
              root={studio.root}
              instances={studio.paneInstances}
              placement="studio"
              studioInstanceId={studio.id}
              scopeId={studio.id}
              onClosePane={(instanceId) => onClosePane(studio.id, instanceId)}
              onDetachPane={(instanceId, x, y) => onDetachPane(studio.id, instanceId, x, y)}
              onLayout={(path, sizes) => onLayout(studio.id, path, sizes)}
            />
          </div>
        ) : null}
      </div>
    </Rnd>
  );
}
