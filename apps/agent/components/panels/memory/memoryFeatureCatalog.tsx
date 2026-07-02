import type { FeatureCatalog, PaneDefinition, StudioPreset } from '@/lib/pane-types';
import {
  MemoryBindingsPane,
  MemoryCorpusPane,
  MemoryIngestPane,
  MemoryJobsPane,
  MemoryOverviewPane,
  MemoryRecallPane,
} from './panes/MemoryTabPanes';

const overview: PaneDefinition = {
  id: 'memory.overview',
  featureId: 'memory',
  label: 'Overview',
  defaultSpan: 'half',
  component: MemoryOverviewPane,
};

const corpus: PaneDefinition = {
  id: 'memory.corpus',
  featureId: 'memory',
  label: 'Corpus',
  defaultSpan: 'full',
  component: MemoryCorpusPane,
};

const ingest: PaneDefinition = {
  id: 'memory.ingest',
  featureId: 'memory',
  label: 'Ingest',
  defaultSpan: 'half',
  component: MemoryIngestPane,
};

const bindings: PaneDefinition = {
  id: 'memory.bindings',
  featureId: 'memory',
  label: 'Bindings',
  defaultSpan: 'half',
  component: MemoryBindingsPane,
};

const recall: PaneDefinition = {
  id: 'memory.recall',
  featureId: 'memory',
  label: 'Recall lab',
  defaultSpan: 'full',
  component: MemoryRecallPane,
};

const jobs: PaneDefinition = {
  id: 'memory.jobs',
  featureId: 'memory',
  label: 'Jobs',
  defaultSpan: 'half',
  component: MemoryJobsPane,
};

const consoleStudio: StudioPreset = {
  id: 'memory.console',
  featureId: 'memory',
  label: 'Console',
  root: {
    type: 'split',
    direction: 'col',
    sizes: [2, 3],
    children: [
      { type: 'pane', paneId: overview.id },
      {
        type: 'split',
        direction: 'row',
        sizes: [1, 1],
        children: [
          { type: 'pane', paneId: corpus.id },
          { type: 'pane', paneId: recall.id },
        ],
      },
    ],
  },
};

export const memoryFeatureCatalog: FeatureCatalog = {
  featureId: 'memory',
  label: 'Agent Memory',
  panes: [overview, corpus, ingest, bindings, recall, jobs],
  studios: [consoleStudio],
};
