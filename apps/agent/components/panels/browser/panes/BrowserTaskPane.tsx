'use client';

import type { PaneRenderContext } from '@/lib/pane-types';
import { BrowserTaskView } from './BrowserTaskView';

export function BrowserTaskPane({ context: _context }: { context: PaneRenderContext }) {
  return (
    <div className="h-full min-h-0 overflow-hidden">
      <BrowserTaskView />
    </div>
  );
}
