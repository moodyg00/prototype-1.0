import type { ToolId } from './tools';

export type ToolSurface = 'docked' | 'container' | 'floating' | 'drawer';

export interface ToolBounds {
  width: number;
  height: number;
}

export interface ToolRenderContext {
  surface: ToolSurface;
  toolId: ToolId;
  instanceId?: string;
  barId?: string;
  containerId?: string;
  bounds: ToolBounds;
}

export const DEFAULT_TOOL_BOUNDS: ToolBounds = { width: 0, height: 0 };

export function createToolRenderContext(
  input: Omit<ToolRenderContext, 'bounds'> & { bounds?: ToolBounds },
): ToolRenderContext {
  return {
    ...input,
    bounds: input.bounds ?? DEFAULT_TOOL_BOUNDS,
  };
}