import type { ToolViewRegistration } from '@/lib/tool-views';
import { PhotographyPanelView } from './PhotographyPanelView';
import { PhotographyStudioView } from './PhotographyStudioView';

export const photographyToolViews: ToolViewRegistration = {
  docked: PhotographyPanelView,
  container: PhotographyStudioView,
  floating: PhotographyStudioView,
  drawer: PhotographyPanelView,
};