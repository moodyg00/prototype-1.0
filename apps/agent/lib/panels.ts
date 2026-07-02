import type { ToolId } from './tools';
import { getTool } from './tools';

export type PanelSource = 'floating' | 'bar' | 'container';

export interface PanelInstance {
  id: string;
  toolId: ToolId;
  x: number;
  y: number;
  w: number;
  h: number;
  minimized: boolean;
  zIndex: number;
  source: PanelSource;
  barId?: string;
  containerId?: string;
  detached?: boolean;
  groupId?: string;
}

export function defaultPanelId(toolId: ToolId, suffix = ''): string {
  return `panel-${toolId}${suffix ? `-${suffix}` : ''}`;
}

export function createFloatingPanel(
  toolId: ToolId,
  options: Partial<Pick<PanelInstance, 'id' | 'x' | 'y' | 'w' | 'h' | 'zIndex' | 'source' | 'barId' | 'containerId' | 'detached'>> = {},
): PanelInstance {
  const tool = getTool(toolId);
  return {
    id: options.id ?? defaultPanelId(toolId),
    toolId,
    x: options.x ?? 80,
    y: options.y ?? 80,
    w: options.w ?? tool.defaultSize.w,
    h: options.h ?? tool.defaultSize.h,
    minimized: false,
    zIndex: options.zIndex ?? 10,
    source: options.source ?? 'floating',
    barId: options.barId,
    containerId: options.containerId,
    detached: options.detached,
  };
}