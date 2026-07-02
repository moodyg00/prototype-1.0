import type { ComponentType } from 'react';
import type { ToolId } from './tools';

/**
 * Proportional height a Pane occupies when stacked in a Panel.
 * Weight mapping lives in panel-layout.ts (`third=1, half=2, full=3`).
 */
export type PaneSpan = 'third' | 'half' | 'full';

export type PanePlacement = 'panel' | 'window' | 'studio';

export interface PaneRenderContext {
  placement: PanePlacement;
  paneId: string;
  featureId: ToolId;
  instanceId: string;
  /** Runtime studio instance id when pane lives in or was detached from a studio. */
  studioInstanceId?: string;
  /** Feature-state scope key — studio instance id or a fallback for standalone panes. */
  scopeId: string;
  bounds: { width: number; height: number };
}

export type PaneComponent = ComponentType<{ context: PaneRenderContext }>;

export interface PaneDefinition {
  /** Fully-qualified id, e.g. `media-library.grid`. */
  id: string;
  featureId: ToolId;
  label: string;
  defaultSpan: PaneSpan;
  component: PaneComponent;
  /** True for panes that only exist as a fallback wrapper around a legacy tool view. */
  isLegacyWrapper?: boolean;
}

export type SplitDirection = 'col' | 'row';

/** A leaf referencing one placed pane instance, or a nested split of children. */
export type SplitNode =
  | { type: 'pane'; instanceId: string }
  | { type: 'split'; direction: SplitDirection; children: SplitNode[]; sizes?: number[] };

export interface PaneInstance {
  instanceId: string;
  paneId: string;
  featureId: ToolId;
}

export interface StudioPreset {
  id: string;
  featureId: ToolId;
  label: string;
  /** Split tree template built from paneIds; instance ids are minted when the studio opens. */
  root: StudioSplitTemplate;
}

export type StudioSplitTemplate =
  | { type: 'pane'; paneId: string }
  | { type: 'split'; direction: SplitDirection; children: StudioSplitTemplate[]; sizes?: number[] };

export interface FeatureCatalog {
  featureId: ToolId;
  label: string;
  panes: PaneDefinition[];
  studios: StudioPreset[];
}

export interface PaneWindowInstance {
  id: string;
  instanceId: string;
  paneId: string;
  featureId: ToolId;
  x: number;
  y: number;
  w: number;
  h: number;
  minimized: boolean;
  zIndex: number;
  /** Panel this pane was detached from, used to offer a "dock back" action. */
  originContainerId?: string;
  /** Studio this pane was detached from, used to offer a "dock back to studio" action. */
  originStudioId?: string;
  /** Tooltip bar this pane was detached from (bar → pane window migration). */
  originBarId?: string;
  /** Canvas group this window belongs to. */
  groupId?: string;
}

export type PaneWindowOrigin =
  | { kind: 'panel'; containerId: string }
  | { kind: 'studio'; studioId: string };

export function getPaneWindowOrigin(win: PaneWindowInstance): PaneWindowOrigin | null {
  if (win.originStudioId) return { kind: 'studio', studioId: win.originStudioId };
  if (win.originContainerId) return { kind: 'panel', containerId: win.originContainerId };
  return null;
}

export interface StudioInstance {
  id: string;
  studioId: string;
  featureId: ToolId;
  x: number;
  y: number;
  w: number;
  h: number;
  minimized: boolean;
  zIndex: number;
  root: SplitNode;
  paneInstances: Record<string, PaneInstance>;
  groupId?: string;
}

export type CanvasWindowRef =
  | { kind: 'studio'; id: string }
  | { kind: 'pane-window'; id: string }
  | { kind: 'floating-panel'; id: string };

export interface CanvasGroup {
  id: string;
  members: CanvasWindowRef[];
  locked: boolean;
}

export function legacyPaneId(featureId: ToolId): string {
  return `${featureId}.__default`;
}

export function paneSpanWeight(span: PaneSpan): number {
  if (span === 'third') return 1;
  if (span === 'half') return 2;
  return 3;
}

let instanceCounter = 0;

export function createInstanceId(paneId: string): string {
  instanceCounter += 1;
  return `${paneId}__${Date.now().toString(36)}${instanceCounter}`;
}
