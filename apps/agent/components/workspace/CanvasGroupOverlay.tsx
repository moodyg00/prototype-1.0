'use client';

import { Rnd } from 'react-rnd';

import { groupBounds } from '@/lib/canvas-groups';
import type { CanvasGroup } from '@/lib/pane-types';
import type { PanelInstance } from '@/lib/panels';
import type { PaneWindowInstance, StudioInstance } from '@/lib/pane-types';

interface CanvasGroupOverlayProps {
  group: CanvasGroup;
  scale: number;
  studios: StudioInstance[];
  paneWindows: PaneWindowInstance[];
  floatingPanels: PanelInstance[];
  onResize: (groupId: string, bounds: { x: number; y: number; w: number; h: number }) => void;
}

export function CanvasGroupOverlay({
  group,
  scale,
  studios,
  paneWindows,
  floatingPanels,
  onResize,
}: CanvasGroupOverlayProps) {
  if (!group.locked) return null;
  const bounds = groupBounds(group.members, studios, paneWindows, floatingPanels);
  if (!bounds) return null;

  return (
    <Rnd
      position={{ x: bounds.x, y: bounds.y }}
      size={{ width: bounds.w, height: bounds.h }}
      scale={scale}
      style={{ zIndex: 5, position: 'absolute' }}
      enableResizing={{
        top: true,
        right: true,
        bottom: true,
        left: true,
        topRight: true,
        bottomRight: true,
        bottomLeft: true,
        topLeft: true,
      }}
      disableDragging
      onResizeStop={(_e, _dir, ref, _delta, position) => {
        onResize(group.id, {
          x: position.x,
          y: position.y,
          w: ref.offsetWidth,
          h: ref.offsetHeight,
        });
      }}
      className="canvas-group-overlay"
    >
      <div className="pointer-events-none h-full w-full rounded border border-dashed border-[rgba(57,255,20,0.4)] bg-[rgba(57,255,20,0.04)]" />
    </Rnd>
  );
}
