import type { FeatureCatalog, PaneDefinition, StudioPreset } from '@/lib/pane-types';
import { RunsDetailPane } from './panes/RunsDetailPane';
import { RunsListPane } from './panes/RunsListPane';

const listPane: PaneDefinition = {
  id: 'runs.list',
  featureId: 'runs',
  label: 'Run traces',
  defaultSpan: 'full',
  component: RunsListPane,
};

const detailPane: PaneDefinition = {
  id: 'runs.detail',
  featureId: 'runs',
  label: 'Run detail',
  defaultSpan: 'half',
  component: RunsDetailPane,
};

const consoleStudio: StudioPreset = {
  id: 'runs.console',
  featureId: 'runs',
  label: 'Traces',
  root: {
    type: 'split',
    direction: 'row',
    sizes: [3, 2],
    children: [
      { type: 'pane', paneId: listPane.id },
      { type: 'pane', paneId: detailPane.id },
    ],
  },
};

export const runsFeatureCatalog: FeatureCatalog = {
  featureId: 'runs',
  label: 'Runs',
  panes: [listPane, detailPane],
  studios: [consoleStudio],
};
