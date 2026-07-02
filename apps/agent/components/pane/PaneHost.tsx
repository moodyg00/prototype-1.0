'use client';

import { CornerDownLeft, GripVertical, Minus, X } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { findPaneDefinition } from '@/lib/pane-catalog';
import { DEFAULT_TOOL_BOUNDS } from '@/lib/tool-surfaces';
import { getTool } from '@/lib/tools';
import type { PanePlacement, PaneInstance } from '@/lib/pane-types';
import { DETACH_THRESHOLD } from '@/components/workspace/WorkspaceProvider';
import { PaneScopeProvider, standalonePaneScopeId } from '@/components/pane/PaneScopeContext';

interface PaneHostProps {
  instance: PaneInstance;
  placement: PanePlacement;
  studioInstanceId?: string;
  scopeId?: string;
  onClose: () => void;
  onDetach?: (screenX: number, screenY: number) => void;
  showChrome?: boolean;
  /** Window placement: dock back to panel or studio. */
  onDock?: () => void;
  dockTitle?: string;
  onMinimize?: () => void;
  hideBody?: boolean;
  onTitlebarClick?: (event: React.MouseEvent) => void;
}

/** Titlebar + ResizeObserver shell around one placed Pane. Same body renders in Panel, Window, or Studio. */
export function PaneHost({
  instance,
  placement,
  studioInstanceId,
  scopeId: scopeIdProp,
  onClose,
  onDetach,
  showChrome = true,
  onDock,
  dockTitle,
  onMinimize,
  hideBody = false,
  onTitlebarClick,
}: PaneHostProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [bounds, setBounds] = useState(DEFAULT_TOOL_BOUNDS);
  const dragRef = useRef<{ x: number; y: number; active: boolean }>({ x: 0, y: 0, active: false });
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      setBounds({ width, height });
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const definition = findPaneDefinition(instance.featureId, instance.paneId);
  const tool = getTool(instance.featureId);
  const Icon = tool.icon;
  const label = definition?.label ?? tool.label;

  const scopeId = scopeIdProp ?? studioInstanceId ?? standalonePaneScopeId(instance.instanceId, placement);

  const context = useMemo(
    () => ({
      placement,
      paneId: instance.paneId,
      featureId: instance.featureId,
      instanceId: instance.instanceId,
      studioInstanceId,
      scopeId,
      bounds,
    }),
    [placement, instance.paneId, instance.featureId, instance.instanceId, studioInstanceId, scopeId, bounds],
  );

  const scopeValue = useMemo(
    () => ({
      scopeId,
      studioInstanceId,
      featureId: instance.featureId,
      paneId: instance.paneId,
      instanceId: instance.instanceId,
      placement,
    }),
    [scopeId, studioInstanceId, instance.featureId, instance.paneId, instance.instanceId, placement],
  );

  const onPointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!onDetach) return;
      dragRef.current = { x: event.clientX, y: event.clientY, active: true };
      setDragging(true);
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [onDetach],
  );

  const onPointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!dragRef.current.active || !onDetach) return;
      const dx = event.clientX - dragRef.current.x;
      const dy = event.clientY - dragRef.current.y;
      if (Math.hypot(dx, dy) >= DETACH_THRESHOLD) {
        dragRef.current.active = false;
        setDragging(false);
        event.currentTarget.releasePointerCapture(event.pointerId);
        onDetach(event.clientX, event.clientY);
      }
    },
    [onDetach],
  );

  const onPointerUp = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    dragRef.current.active = false;
    setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }, []);

  if (!definition) {
    return (
      <div className="flex h-full min-h-0 items-center justify-center bg-[#111113] text-[11px] text-red-300">
        Unknown pane &quot;{instance.paneId}&quot;
      </div>
    );
  }

  const Component = definition.component;

  return (
    <div
      ref={containerRef}
      className={`pane-host flex h-full min-h-0 min-w-0 flex-col overflow-hidden ${
        dragging ? 'opacity-80' : ''
      }`}
    >
      {showChrome ? (
        <div
          className={
            placement === 'window'
              ? 'panel-titlebar panel-drag-handle flex shrink-0 cursor-grab items-center justify-between active:cursor-grabbing'
              : 'pane-titlebar flex shrink-0 cursor-grab items-center justify-between border-b border-white/8 bg-[#111113] px-2 py-1.5 active:cursor-grabbing'
          }
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onClick={onTitlebarClick}
        >
          <div className="flex min-w-0 items-center gap-1.5">
            {placement !== 'window' ? <GripVertical size={11} className="shrink-0 text-zinc-600" /> : null}
            <Icon size={placement === 'window' ? 13 : 12} className="shrink-0 text-zinc-400" />
            <span
              className={`truncate font-medium text-zinc-200 ${placement === 'window' ? 'text-xs' : 'text-[11px]'}`}
            >
              {label}
            </span>
          </div>
          <div className="ml-2 flex shrink-0 items-center gap-0.5">
            {onDock ? (
              <button
                type="button"
                className="panel-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onDock();
                }}
                title={dockTitle ?? 'Dock'}
              >
                <CornerDownLeft size={11} />
              </button>
            ) : null}
            {onMinimize ? (
              <button
                type="button"
                className="panel-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onMinimize();
                }}
                title="Minimize"
              >
                <Minus size={11} />
              </button>
            ) : null}
            <button
              type="button"
              className="panel-btn panel-btn-close"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              title="Close"
            >
              <X size={placement === 'window' ? 11 : 10} />
            </button>
          </div>
        </div>
      ) : null}
      {!hideBody ? (
        <div className="min-h-0 flex-1 overflow-hidden" onPointerDown={(e) => e.stopPropagation()}>
          <PaneScopeProvider value={scopeValue}>
            <Component context={context} />
          </PaneScopeProvider>
        </div>
      ) : null}
    </div>
  );
}
