import type { ToolViewRegistration } from '@/lib/tool-views';
import { MemoryConsoleView } from './MemoryConsoleView';
import { MemoryInspectorView } from './MemoryInspectorView';
import { MemoryQueueDrawer } from './MemoryQueueDrawer';

export const memoryToolViews: ToolViewRegistration = {
  docked: MemoryConsoleView,
  container: MemoryConsoleView,
  floating: MemoryInspectorView,
  drawer: MemoryQueueDrawer,
};