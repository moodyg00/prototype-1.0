import type { FeatureCatalog, PaneDefinition, StudioPreset } from '@/lib/pane-types';
import { DetailPane } from './panes/DetailPane';
import { ExplorerPane } from './panes/ExplorerPane';
import { FiltersPane } from './panes/FiltersPane';
import { GridCompactPane, GridPane } from './panes/GridPane';
import { UploadPane } from './panes/UploadPane';

const explorer: PaneDefinition = {
  id: 'media-library.explorer',
  featureId: 'media-library',
  label: 'File explorer',
  defaultSpan: 'full',
  component: ExplorerPane,
};

const upload: PaneDefinition = {
  id: 'media-library.upload',
  featureId: 'media-library',
  label: 'Upload',
  defaultSpan: 'third',
  component: UploadPane,
};

const filtersPane: PaneDefinition = {
  id: 'media-library.filters',
  featureId: 'media-library',
  label: 'Filters',
  defaultSpan: 'third',
  component: FiltersPane,
};

const grid: PaneDefinition = {
  id: 'media-library.grid',
  featureId: 'media-library',
  label: 'Media grid',
  defaultSpan: 'full',
  component: GridPane,
};

const gridCompact: PaneDefinition = {
  id: 'media-library.grid-compact',
  featureId: 'media-library',
  label: 'Compact grid',
  defaultSpan: 'half',
  component: GridCompactPane,
};

const detail: PaneDefinition = {
  id: 'media-library.detail',
  featureId: 'media-library',
  label: 'Detail inspector',
  defaultSpan: 'half',
  component: DetailPane,
};

/**
 * `media-library.console` — replaces the old MediaLibraryConsoleView: filters strip on
 * top, media grid + inline detail inspector sharing the remaining height side by side.
 */
const consoleStudio: StudioPreset = {
  id: 'media-library.console',
  featureId: 'media-library',
  label: 'Console',
  root: {
    type: 'split',
    direction: 'col',
    sizes: [1, 5],
    children: [
      { type: 'pane', paneId: filtersPane.id },
      {
        type: 'split',
        direction: 'row',
        sizes: [3, 2],
        children: [
          { type: 'pane', paneId: grid.id },
          { type: 'pane', paneId: detail.id },
        ],
      },
    ],
  },
};

export const mediaLibraryFeatureCatalog: FeatureCatalog = {
  featureId: 'media-library',
  label: 'Media Library',
  panes: [explorer, upload, filtersPane, grid, gridCompact, detail],
  studios: [consoleStudio],
};
