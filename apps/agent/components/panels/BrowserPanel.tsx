'use client';

/** @deprecated Use BrowserTaskView + BrowserLoginView panes inside the browser studio. */
import { BrowserTaskView } from '@/components/panels/browser/panes/BrowserTaskView';

export function BrowserPanel() {
  return <BrowserTaskView />;
}

export type { BrowserMode } from '@/components/panels/browser/browser-types';
