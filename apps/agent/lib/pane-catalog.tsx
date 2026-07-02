'use client';

import React from 'react';
import { ToolViewHost } from '@/components/tools/ToolViewHost';
import { agentsFeatureCatalog } from '@/components/panels/agents/agentsFeatureCatalog';
import { mediaLibraryFeatureCatalog } from '@/components/panels/media-library/mediaLibraryFeatureCatalog';
import { memoryFeatureCatalog } from '@/components/panels/memory/memoryFeatureCatalog';
import { photographyFeatureCatalog } from '@/components/panels/photography/photographyFeatureCatalog';
import { runnerFeatureCatalog } from '@/components/panels/runner/runnerFeatureCatalog';
import { runsFeatureCatalog } from '@/components/panels/runs/runsFeatureCatalog';
import { browserFeatureCatalog } from '@/components/panels/browser/browserFeatureCatalog';
import { videoProductionFeatureCatalog } from '@/components/panels/video-production/videoProductionFeatureCatalog';
import { workflowFeatureCatalog } from '@/components/panels/workflow/workflowFeatureCatalog';
import { ALL_TOOL_IDS, getTool, type ToolId } from './tools';
import {
  legacyPaneId,
  type FeatureCatalog,
  type PaneDefinition,
  type PaneRenderContext,
  type StudioPreset,
} from './pane-types';

export { legacyPaneId };

/**
 * Renders a legacy (un-migrated) Feature's existing tool view inside a Pane shell.
 * Bridges the new Pane render context down to the old `ToolViewHost` (`surface="container"`)
 * so tooltip bars / docked panels / floating windows keep working unchanged during the
 * migration — only the Panel slot host has moved to the pane system.
 */
function LegacyFeaturePane({ context }: { context: PaneRenderContext }) {
  return (
    <ToolViewHost
      toolId={context.featureId}
      surface="container"
      containerId={context.instanceId}
      className="h-full min-h-0 w-full min-w-0"
    />
  );
}

function wrapLegacyFeature(featureId: ToolId): FeatureCatalog {
  const tool = getTool(featureId);
  const pane: PaneDefinition = {
    id: legacyPaneId(featureId),
    featureId,
    label: tool.label,
    defaultSpan: 'full',
    component: LegacyFeaturePane,
    isLegacyWrapper: true,
  };
  return { featureId, label: tool.label, panes: [pane], studios: [] };
}

const MIGRATED_CATALOGS: Partial<Record<ToolId, FeatureCatalog>> = {
  agents: agentsFeatureCatalog,
  'media-library': mediaLibraryFeatureCatalog,
  photography: photographyFeatureCatalog,
  video: videoProductionFeatureCatalog,
  memory: memoryFeatureCatalog,
  workflow: workflowFeatureCatalog,
  runner: runnerFeatureCatalog,
  runs: runsFeatureCatalog,
  browser: browserFeatureCatalog,
};

const catalogCache = new Map<ToolId, FeatureCatalog>();

export function getFeatureCatalog(featureId: ToolId): FeatureCatalog {
  const cached = catalogCache.get(featureId);
  if (cached) return cached;
  const catalog = MIGRATED_CATALOGS[featureId] ?? wrapLegacyFeature(featureId);
  catalogCache.set(featureId, catalog);
  return catalog;
}

export function isFeatureMigrated(featureId: ToolId): boolean {
  return Boolean(MIGRATED_CATALOGS[featureId]);
}

export function getAllFeatureCatalogs(): FeatureCatalog[] {
  return ALL_TOOL_IDS.map((id) => getFeatureCatalog(id));
}

export function findPaneDefinition(featureId: ToolId, paneId: string): PaneDefinition | null {
  const catalog = getFeatureCatalog(featureId);
  return catalog.panes.find((pane) => pane.id === paneId) ?? null;
}

export function defaultPaneForFeature(featureId: ToolId): PaneDefinition {
  const catalog = getFeatureCatalog(featureId);
  return catalog.panes[0] ?? wrapLegacyFeature(featureId).panes[0];
}

/** First studio preset for a feature, or null when the catalog has no studios. */
export function defaultStudioForFeature(featureId: ToolId): StudioPreset | null {
  const catalog = getFeatureCatalog(featureId);
  return catalog.studios[0] ?? null;
}

export function featureHasStudio(featureId: ToolId): boolean {
  return defaultStudioForFeature(featureId) !== null;
}

/** Migrated features without a studio preset open as a single pane on the canvas. */
export function featureOpensAsCanvasPane(featureId: ToolId): boolean {
  return isFeatureMigrated(featureId) && !featureHasStudio(featureId);
}

/** Only unmigrated legacy tools still dock to the tooltip bar. */
export function featureUsesDockedBar(featureId: ToolId): boolean {
  return !featureHasStudio(featureId) && !isFeatureMigrated(featureId);
}

export function toolbarPaneWindowId(featureId: ToolId): string {
  return `pane-window-toolbar-${featureId}`;
}
