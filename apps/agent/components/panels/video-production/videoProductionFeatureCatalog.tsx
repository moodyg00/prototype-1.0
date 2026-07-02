import type { FeatureCatalog, PaneDefinition, StudioPreset } from '@/lib/pane-types';
import {
  VideoModelPickerPane,
  VideoParamsPane,
  VideoPreviewPane,
  VideoQueuePane,
  VideoQuickGenPane,
  VideoTimelinePane,
} from './panes/VideoPanes';

const modelPicker: PaneDefinition = {
  id: 'video.model-picker',
  featureId: 'video',
  label: 'Model picker',
  defaultSpan: 'third',
  component: VideoModelPickerPane,
};

const params: PaneDefinition = {
  id: 'video.params',
  featureId: 'video',
  label: 'Production params',
  defaultSpan: 'third',
  component: VideoParamsPane,
};

const quickGen: PaneDefinition = {
  id: 'video.quick-gen',
  featureId: 'video',
  label: 'Quick generate',
  defaultSpan: 'half',
  component: VideoQuickGenPane,
};

const preview: PaneDefinition = {
  id: 'video.preview',
  featureId: 'video',
  label: 'Program monitor',
  defaultSpan: 'full',
  component: VideoPreviewPane,
};

const queue: PaneDefinition = {
  id: 'video.queue',
  featureId: 'video',
  label: 'Render queue',
  defaultSpan: 'half',
  component: VideoQueuePane,
};

const timeline: PaneDefinition = {
  id: 'video.timeline',
  featureId: 'video',
  label: 'Timeline',
  defaultSpan: 'full',
  component: VideoTimelinePane,
};

const studioPreset: StudioPreset = {
  id: 'video.studio',
  featureId: 'video',
  label: 'Studio',
  root: {
    type: 'split',
    direction: 'col',
    sizes: [1, 4, 2],
    children: [
      {
        type: 'split',
        direction: 'row',
        sizes: [1, 1],
        children: [
          { type: 'pane', paneId: modelPicker.id },
          { type: 'pane', paneId: params.id },
        ],
      },
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

export const videoProductionFeatureCatalog: FeatureCatalog = {
  featureId: 'video',
  label: 'Video Production',
  panes: [modelPicker, params, quickGen, preview, queue, timeline],
  studios: [studioPreset],
};
