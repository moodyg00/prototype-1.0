import type { ToolRenderContext } from './tool-surfaces';

/**
 * Stable key for per-instance tool state (selection, scroll, etc.).
 * A future ToolInstanceProvider can use this to persist state across
 * surface transitions (e.g. container list selection → floating grid).
 */
export function toolInstanceKey(ctx: ToolRenderContext): string {
  const parts: string[] = [ctx.toolId, ctx.surface];

  if (ctx.instanceId) parts.push(ctx.instanceId);
  if (ctx.barId) parts.push(`bar:${ctx.barId}`);
  if (ctx.containerId) parts.push(`container:${ctx.containerId}`);

  return parts.join(':');
}