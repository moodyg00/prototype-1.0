import type { FeatureCatalog, PaneDefinition, StudioPreset } from '@/lib/pane-types';
import { BrowserLoginPane } from './panes/BrowserLoginPane';
import { BrowserTaskPane } from './panes/BrowserTaskPane';

const taskPane: PaneDefinition = {
  id: 'browser.task',
  featureId: 'browser',
  label: 'Browser',
  defaultSpan: 'full',
  component: BrowserTaskPane,
};

const loginPane: PaneDefinition = {
  id: 'browser.login',
  featureId: 'browser',
  label: 'Login',
  defaultSpan: 'half',
  component: BrowserLoginPane,
};

const consoleStudio: StudioPreset = {
  id: 'browser.console',
  featureId: 'browser',
  label: 'Console',
  root: {
    type: 'split',
    direction: 'row',
    sizes: [3, 2],
    children: [
      { type: 'pane', paneId: taskPane.id },
      { type: 'pane', paneId: loginPane.id },
    ],
  },
};

export const browserFeatureCatalog: FeatureCatalog = {
  featureId: 'browser',
  label: 'Browser',
  panes: [taskPane, loginPane],
  studios: [consoleStudio],
};
