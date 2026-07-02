'use client';

import type { PaneRenderContext } from '@/lib/pane-types';
import { RunsListView } from './RunsListView';

export function RunsListPane({ context: _context }: { context: PaneRenderContext }) {
  return (
    <div className="h-full min-h-0 overflow-hidden">
      <RunsListView />
    </div>
  );
}
