import type { FeatureCatalog, PaneDefinition, StudioPreset } from '@/lib/pane-types';
import {
  WorkflowBuilderPane,
  WorkflowInspectorPane,
  WorkflowPalettePane,
  WorkflowRunnerPane,
} from './panes/WorkflowPanes';

const palette: PaneDefinition = {
  id: 'workflow.palette',
  featureId: 'workflow',
  label: 'Node palette',
  defaultSpan: 'third',
  component: WorkflowPalettePane,
};

const canvas: PaneDefinition = {
  id: 'workflow.canvas',
  featureId: 'workflow',
  label: 'Graph builder',
  defaultSpan: 'full',
  component: WorkflowBuilderPane,
};

const inspector: PaneDefinition = {
  id: 'workflow.inspector',
  featureId: 'workflow',
  label: 'Node inspector',
  defaultSpan: 'half',
  component: WorkflowInspectorPane,
};

const runner: PaneDefinition = {
  id: 'workflow.runner',
  featureId: 'workflow',
  label: 'Runner',
  defaultSpan: 'full',
  component: WorkflowRunnerPane,
};

const builderStudio: StudioPreset = {
  id: 'workflow.builder',
  featureId: 'workflow',
  label: 'Builder',
  root: {
    type: 'split',
    direction: 'row',
    sizes: [1, 4, 2],
    children: [
      { type: 'pane', paneId: palette.id },
      {
        type: 'split',
        direction: 'col',
        sizes: [3, 2],
        children: [
          { type: 'pane', paneId: canvas.id },
          { type: 'pane', paneId: runner.id },
        ],
      },
      { type: 'pane', paneId: inspector.id },
    ],
  },
};

export const workflowFeatureCatalog: FeatureCatalog = {
  featureId: 'workflow',
  label: 'Workflow',
  panes: [palette, canvas, inspector, runner],
  studios: [builderStudio],
};
