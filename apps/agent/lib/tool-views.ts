import type { ComponentType } from 'react';
import { memoryToolViews } from '@/components/panels/memory';
import { mediaLibraryToolViews } from '@/components/panels/media-library';
import { photographyToolViews } from '@/components/panels/photography';
import { videoProductionToolViews } from '@/components/panels/video-production';
import type { ToolId } from './tools';
import type { ToolRenderContext, ToolSurface } from './tool-surfaces';

export type ToolViewComponent = ComponentType<{
  toolId: ToolId;
  context: ToolRenderContext;
}>;

export interface ToolViewRegistration {
  docked?: ToolViewComponent;
  container?: ToolViewComponent;
  floating?: ToolViewComponent;
  drawer?: ToolViewComponent;
  default?: ToolViewComponent;
}

export const TOOL_VIEW_REGISTRY: Partial<Record<ToolId, ToolViewRegistration>> = {
  memory: memoryToolViews,
  'media-library': mediaLibraryToolViews,
  photography: photographyToolViews,
  video: videoProductionToolViews,
};

export function resolveToolViewComponent(
  registration: ToolViewRegistration | undefined,
  surface: ToolSurface,
): ToolViewComponent | null {
  if (!registration) return null;
  return registration[surface] ?? registration.default ?? null;
}

export function getRegisteredToolView(
  toolId: ToolId,
  surface: ToolSurface,
): ToolViewComponent | null {
  return resolveToolViewComponent(TOOL_VIEW_REGISTRY[toolId], surface);
}