import type { ToolViewRegistration } from '@/lib/tool-views';
import { MediaLibraryConsoleView } from './MediaLibraryConsoleView';
import { MediaLibraryDrawerView } from './MediaLibraryDrawerView';
import { MediaLibraryPanelView } from './MediaLibraryPanelView';

export const mediaLibraryToolViews: ToolViewRegistration = {
  docked: MediaLibraryPanelView,
  container: MediaLibraryConsoleView,
  floating: MediaLibraryConsoleView,
  drawer: MediaLibraryDrawerView,
};