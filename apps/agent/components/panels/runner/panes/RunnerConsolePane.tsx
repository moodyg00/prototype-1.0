'use client';

import type { PaneRenderContext } from '@/lib/pane-types';
import { RunnerPanel } from '../../RunnerPanel';

export function RunnerConsolePane({ context: _context }: { context: PaneRenderContext }) {
  return (
    <div className="h-full min-h-0 overflow-hidden">
      <RunnerPanel />
    </div>
  );
}
