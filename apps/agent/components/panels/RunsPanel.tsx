'use client';

/** @deprecated Use RunsListView + RunsDetailView panes inside the runs studio. */
import { RunsListView } from '@/components/panels/runs/panes/RunsListView';

export function RunsPanel() {
  return <RunsListView />;
}
