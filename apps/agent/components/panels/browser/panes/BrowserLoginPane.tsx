'use client';

import type { PaneRenderContext } from '@/lib/pane-types';
import { BrowserLoginView } from './BrowserLoginView';

export function BrowserLoginPane({ context: _context }: { context: PaneRenderContext }) {
  return (
    <div className="h-full min-h-0 overflow-hidden">
      <BrowserLoginView />
    </div>
  );
}
