export interface CanvasTransform {
  x: number;
  y: number;
  scale: number;
}

export function screenToCanvasWorld(
  screenX: number,
  screenY: number,
  viewportRect: DOMRect | null,
  canvas: CanvasTransform,
): { x: number; y: number } {
  if (!viewportRect) {
    return { x: screenX, y: screenY };
  }

  const localX = screenX - viewportRect.left;
  const localY = screenY - viewportRect.top;

  return {
    x: (localX - canvas.x) / canvas.scale,
    y: (localY - canvas.y) / canvas.scale,
  };
}

export const CANVAS_MIN_SCALE = 0.35;
export const CANVAS_MAX_SCALE = 2.5;
export const CANVAS_ZOOM_STEP = 1.12;

export function clampCanvasScale(scale: number): number {
  return Math.min(CANVAS_MAX_SCALE, Math.max(CANVAS_MIN_SCALE, scale));
}

export function zoomCanvasAtPointer(
  canvas: CanvasTransform,
  pointerX: number,
  pointerY: number,
  viewportRect: DOMRect,
  deltaY: number,
): CanvasTransform {
  const factor = deltaY > 0 ? 1 / CANVAS_ZOOM_STEP : CANVAS_ZOOM_STEP;
  const nextScale = clampCanvasScale(canvas.scale * factor);
  const localX = pointerX - viewportRect.left;
  const localY = pointerY - viewportRect.top;
  const worldX = (localX - canvas.x) / canvas.scale;
  const worldY = (localY - canvas.y) / canvas.scale;

  return {
    scale: nextScale,
    x: localX - worldX * nextScale,
    y: localY - worldY * nextScale,
  };
}

export interface CanvasViewportInsets {
  leftWidth: number;
  rightWidth: number;
  topHeight: number;
  bottomHeight: number;
}

export function getVisibleCanvasRect(
  viewportRect: DOMRect,
  insets: CanvasViewportInsets,
): DOMRect {
  return new DOMRect(
    viewportRect.left + insets.leftWidth,
    viewportRect.top + insets.topHeight,
    Math.max(0, viewportRect.width - insets.leftWidth - insets.rightWidth),
    Math.max(0, viewportRect.height - insets.topHeight - insets.bottomHeight),
  );
}

export function zoomCanvasAtCenter(
  canvas: CanvasTransform,
  viewportRect: DOMRect,
  direction: 'in' | 'out',
  anchorRect: DOMRect = viewportRect,
): CanvasTransform {
  const centerX = anchorRect.left + anchorRect.width / 2;
  const centerY = anchorRect.top + anchorRect.height / 2;
  const deltaY = direction === 'in' ? -1 : 1;
  return zoomCanvasAtPointer(canvas, centerX, centerY, viewportRect, deltaY);
}