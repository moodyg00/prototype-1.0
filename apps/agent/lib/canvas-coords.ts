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

export function zoomCanvasAtPointer(
  canvas: CanvasTransform,
  pointerX: number,
  pointerY: number,
  viewportRect: DOMRect,
  deltaY: number,
): CanvasTransform {
  const factor = deltaY > 0 ? 0.92 : 1.08;
  const nextScale = Math.min(2.5, Math.max(0.35, canvas.scale * factor));
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