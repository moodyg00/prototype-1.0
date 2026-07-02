import type { CSSProperties } from 'react';
import { PANEL_CONTAINER_WIDTH, TOOLBAR_SIZE, type PinSide, type WorkspaceLayout } from './workspace-layout';

export interface ChromeMetrics {
  leftWidth: number;
  rightWidth: number;
  topHeight: number;
  bottomHeight: number;
}

export interface ChromeRect {
  top?: number;
  left?: number;
  right?: number;
  bottom?: number;
  width?: number;
  height?: number;
}

export function computeChromeMetrics(layout: WorkspaceLayout): ChromeMetrics {
  const leftBars = layout.tooltipBars.filter((bar) => bar.side === 'left').length * TOOLBAR_SIZE;
  const leftContainers = layout.panelContainers
    .filter((container) => container.side === 'left')
    .reduce((sum, container) => sum + container.width, 0);

  const rightContainers = layout.panelContainers
    .filter((container) => container.side === 'right')
    .reduce((sum, container) => sum + container.width, 0);
  const rightBars = layout.tooltipBars.filter((bar) => bar.side === 'right').length * TOOLBAR_SIZE;

  const topBars = layout.tooltipBars.filter((bar) => bar.side === 'top').length * TOOLBAR_SIZE;
  const topContainers = layout.panelContainers
    .filter((container) => container.side === 'top')
    .reduce((sum, container) => sum + container.width, 0);

  const bottomBars = layout.tooltipBars.filter((bar) => bar.side === 'bottom').length * TOOLBAR_SIZE;
  const bottomContainers = layout.panelContainers
    .filter((container) => container.side === 'bottom')
    .reduce((sum, container) => sum + container.width, 0);

  return {
    leftWidth: leftBars + leftContainers,
    rightWidth: rightBars + rightContainers,
    topHeight: topBars + topContainers,
    bottomHeight: bottomBars + bottomContainers,
  };
}

function leftBarsWidth(layout: WorkspaceLayout): number {
  return layout.tooltipBars.filter((bar) => bar.side === 'left').length * TOOLBAR_SIZE;
}

function rightContainersWidth(layout: WorkspaceLayout): number {
  return layout.panelContainers
    .filter((container) => container.side === 'right')
    .reduce((sum, container) => sum + container.width, 0);
}

function topBarsHeight(layout: WorkspaceLayout): number {
  return layout.tooltipBars.filter((bar) => bar.side === 'top').length * TOOLBAR_SIZE;
}

function bottomBarsHeight(layout: WorkspaceLayout): number {
  return layout.tooltipBars.filter((bar) => bar.side === 'bottom').length * TOOLBAR_SIZE;
}

export function getBarRect(layout: WorkspaceLayout, barId: string): ChromeRect | null {
  const bar = layout.tooltipBars.find((item) => item.id === barId);
  if (!bar) return null;

  const metrics = computeChromeMetrics(layout);

  if (bar.side === 'left') {
    const leftBars = layout.tooltipBars.filter((item) => item.side === 'left');
    const index = leftBars.findIndex((item) => item.id === barId);
    return {
      top: 0,
      bottom: 0,
      left: index * TOOLBAR_SIZE,
      width: TOOLBAR_SIZE,
    };
  }

  if (bar.side === 'right') {
    const rightBars = layout.tooltipBars.filter((item) => item.side === 'right');
    const index = rightBars.findIndex((item) => item.id === barId);
    return {
      top: 0,
      bottom: 0,
      right: rightContainersWidth(layout) + index * TOOLBAR_SIZE,
      width: TOOLBAR_SIZE,
    };
  }

  if (bar.side === 'top') {
    const topBars = layout.tooltipBars.filter((item) => item.side === 'top');
    const index = topBars.findIndex((item) => item.id === barId);
    const topContainers = layout.panelContainers
      .filter((container) => container.side === 'top')
      .reduce((sum, container) => sum + container.width, 0);
    return {
      top: topContainers + index * TOOLBAR_SIZE,
      left: metrics.leftWidth,
      right: metrics.rightWidth,
      height: TOOLBAR_SIZE,
    };
  }

  const bottomBars = layout.tooltipBars.filter((item) => item.side === 'bottom');
  const index = bottomBars.findIndex((item) => item.id === barId);
  const bottomContainers = layout.panelContainers
    .filter((container) => container.side === 'bottom')
    .reduce((sum, container) => sum + container.width, 0);
  return {
    bottom: bottomContainers + index * TOOLBAR_SIZE,
    left: metrics.leftWidth,
    right: metrics.rightWidth,
    height: TOOLBAR_SIZE,
  };
}

export function getContainerRect(layout: WorkspaceLayout, containerId: string): ChromeRect | null {
  const container = layout.panelContainers.find((item) => item.id === containerId);
  if (!container) return null;

  const metrics = computeChromeMetrics(layout);
  const size = container.width ?? PANEL_CONTAINER_WIDTH;

  if (container.side === 'left') {
    const leftContainers = layout.panelContainers.filter((item) => item.side === 'left');
    const index = leftContainers.findIndex((item) => item.id === containerId);
    let left = leftBarsWidth(layout);
    for (let i = 0; i < index; i += 1) {
      left += leftContainers[i].width;
    }
    return { top: 0, bottom: 0, left, width: size };
  }

  if (container.side === 'right') {
    const rightContainers = layout.panelContainers.filter((item) => item.side === 'right');
    const index = rightContainers.findIndex((item) => item.id === containerId);
    let right = 0;
    for (let i = 0; i < index; i += 1) {
      right += rightContainers[i].width;
    }
    return { top: 0, bottom: 0, right, width: size };
  }

  if (container.side === 'top') {
    const topContainers = layout.panelContainers.filter((item) => item.side === 'top');
    const index = topContainers.findIndex((item) => item.id === containerId);
    let top = topBarsHeight(layout);
    for (let i = 0; i < index; i += 1) {
      top += topContainers[i].width;
    }
    return {
      top,
      left: metrics.leftWidth,
      right: metrics.rightWidth,
      height: size,
    };
  }

  const bottomContainers = layout.panelContainers.filter((item) => item.side === 'bottom');
  const index = bottomContainers.findIndex((item) => item.id === containerId);
  let bottom = bottomBarsHeight(layout);
  for (let i = 0; i < index; i += 1) {
    bottom += bottomContainers[i].width;
  }
  return {
    bottom,
    left: metrics.leftWidth,
    right: metrics.rightWidth,
    height: size,
  };
}

export function getDockedPanelRect(layout: WorkspaceLayout, barSide: PinSide): ChromeRect {
  const metrics = computeChromeMetrics(layout);
  const dockedWidth = 320;

  if (barSide === 'left') {
    return {
      top: metrics.topHeight,
      bottom: metrics.bottomHeight,
      left: metrics.leftWidth,
      width: dockedWidth,
    };
  }

  if (barSide === 'right') {
    return {
      top: metrics.topHeight,
      bottom: metrics.bottomHeight,
      right: metrics.rightWidth,
      width: dockedWidth,
    };
  }

  if (barSide === 'top') {
    return {
      top: metrics.topHeight,
      left: metrics.leftWidth,
      right: metrics.rightWidth,
      height: dockedWidth,
    };
  }

  return {
    bottom: metrics.bottomHeight,
    left: metrics.leftWidth,
    right: metrics.rightWidth,
    height: dockedWidth,
  };
}

export function chromeRectToStyle(rect: ChromeRect): CSSProperties {
  const style: CSSProperties = { position: 'absolute' };
  if (rect.top !== undefined) style.top = rect.top;
  if (rect.left !== undefined) style.left = rect.left;
  if (rect.right !== undefined) style.right = rect.right;
  if (rect.bottom !== undefined) style.bottom = rect.bottom;
  if (rect.width !== undefined) style.width = rect.width;
  if (rect.height !== undefined) style.height = rect.height;
  return style;
}

export const PANEL_SNAP_DISTANCE = 48;

interface ScreenRect {
  top: number;
  left: number;
  right: number;
  bottom: number;
}

/** Converts a chrome-layer rect (absolute within the viewport shell) to screen coordinates. */
export function chromeRectToScreenBounds(
  rect: ChromeRect,
  viewportWidth: number,
  viewportHeight: number,
  headerHeight = 0,
): ScreenRect {
  const top = (rect.top ?? headerHeight) + headerHeight;
  const bottom = rect.bottom !== undefined ? viewportHeight - rect.bottom : viewportHeight;
  const left = rect.left ?? (rect.right !== undefined && rect.width !== undefined
    ? viewportWidth - rect.right - rect.width
    : 0);
  const right = rect.right !== undefined
    ? viewportWidth - rect.right
    : left + (rect.width ?? 0);
  return { top, left, right, bottom };
}

function distanceToPanelSnapEdge(side: PinSide, bounds: ScreenRect, x: number, y: number): number {
  if (y < bounds.top || y > bounds.bottom) return Infinity;
  if (side === 'left') return Math.abs(x - bounds.right);
  if (side === 'right') return Math.abs(x - bounds.left);
  if (x < bounds.left || x > bounds.right) return Infinity;
  if (side === 'top') return Math.abs(y - bounds.bottom);
  return Math.abs(y - bounds.top);
}

/** Returns the panel container id when a detached pane window is dragged near an edge slot. */
export function findPanelSnapTarget(
  layout: WorkspaceLayout,
  viewportWidth: number,
  viewportHeight: number,
  screenX: number,
  screenY: number,
  headerHeight = 0,
): string | null {
  let best: { id: string; dist: number } | null = null;

  for (const container of layout.panelContainers) {
    const rect = getContainerRect(layout, container.id);
    if (!rect) continue;
    const bounds = chromeRectToScreenBounds(rect, viewportWidth, viewportHeight, headerHeight);
    const dist = distanceToPanelSnapEdge(container.side, bounds, screenX, screenY);
    if (dist <= PANEL_SNAP_DISTANCE && (!best || dist < best.dist)) {
      best = { id: container.id, dist };
    }
  }

  return best?.id ?? null;
}