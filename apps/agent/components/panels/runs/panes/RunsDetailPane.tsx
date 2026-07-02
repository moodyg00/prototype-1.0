'use client';

import type { PaneRenderContext } from '@/lib/pane-types';
import { RunsDetailView } from './RunsDetailView';

export function RunsDetailPane({ context: _context }: { context: PaneRenderContext }) {
  return (
    <div className="h-full min-h-0 overflow-hidden">
      <RunsDetailView />
    </div>
  );
}
