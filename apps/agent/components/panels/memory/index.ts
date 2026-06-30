import type { ToolViewRegistration } from '@/lib/tool-views';
import { MemoryConsoleView } from './MemoryConsoleView';

export const memoryToolViews: ToolViewRegistration = {
  docked: MemoryConsoleView,
  container: MemoryConsoleView,
  floating: MemoryConsoleView,
  drawer: MemoryConsoleView,
};