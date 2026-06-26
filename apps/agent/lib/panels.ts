import { WorkspaceId } from './workspaces';

export interface PanelInstance {
  id: string;
  workspaceId: WorkspaceId;
  x: number;
  y: number;
  w: number;
  h: number;
  minimized: boolean;
  zIndex: number;
}

export function defaultPanelId(workspaceId: WorkspaceId): string {
  return `panel-${workspaceId}`;
}
