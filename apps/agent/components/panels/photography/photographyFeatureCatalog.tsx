import type { FeatureCatalog, PaneDefinition, StudioPreset } from '@/lib/pane-types';
import { ModelPickerPane } from './panes/ModelPickerPane';
import { PreviewPane } from './panes/PreviewPane';
import { QuickGenPane } from './panes/QuickGenPane';
import { QueuePane } from './panes/QueuePane';

const modelPicker: PaneDefinition = {
  id: 'photography.model-picker',
  featureId: 'photography',
  label: 'Model picker',
  defaultSpan: 'third',
  component: ModelPickerPane,
};

const quickGen: PaneDefinition = {
  id: 'photography.quick-gen',
  featureId: 'photography',
  label: 'Quick generate',
  defaultSpan: 'half',
  component: QuickGenPane,
};

const preview: PaneDefinition = {
  id: 'photography.preview',
  featureId: 'photography',
  label: 'Preview',
  defaultSpan: 'full',
  component: PreviewPane,
};

const queue: PaneDefinition = {
  id: 'photography.queue',
  featureId: 'photography',
  label: 'Render queue',
  defaultSpan: 'half',
  component: QueuePane,
};

const studioPreset: StudioPreset = {
  id: 'photography.studio',
  featureId: 'photography',
  label: 'Studio',
  root: {
    type: 'split',
    direction: 'col',
    sizes: [1, 3, 2],
    children: [
      { type: 'pane', paneId: modelPicker.id },
      {
        type: 'split',
        direction: 'row',
        sizes: [3, 2],
        children: [
          { type: 'pane', paneId: quickGen.id },
          { type: 'pane', paneId: preview.id },
        ],
      },
      { type: 'pane', paneId: queue.id },
    ],
  },
};

export const photographyFeatureCatalog: FeatureCatalog = {
  featureId: 'photography',
  label: 'Photography',
  panes: [modelPicker, quickGen, preview, queue],
  studios: [studioPreset],
};
