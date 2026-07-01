import type { ToolViewRegistration } from '@/lib/tool-views';
import { VideoProductionDrawerView } from './VideoProductionDrawerView';
import { VideoProductionPanelView } from './VideoProductionPanelView';
import { VideoProductionStudioView } from './VideoProductionStudioView';

export const videoProductionToolViews: ToolViewRegistration = {
  docked: VideoProductionPanelView,
  container: VideoProductionStudioView,
  floating: VideoProductionStudioView,
  drawer: VideoProductionDrawerView,
};