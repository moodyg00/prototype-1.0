import type { FeatureCatalog, PaneDefinition } from '@/lib/pane-types';
import { RunnerConsolePane } from './panes/RunnerConsolePane';

const consolePane: PaneDefinition = {
  id: 'runner.console',
  featureId: 'runner',
  label: 'Runner console',
  defaultSpan: 'full',
  component: RunnerConsolePane,
};

export const runnerFeatureCatalog: FeatureCatalog = {
  featureId: 'runner',
  label: 'Runner',
  panes: [consolePane],
  studios: [],
};
