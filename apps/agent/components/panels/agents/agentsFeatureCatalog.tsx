import type { FeatureCatalog, PaneDefinition, StudioPreset } from '@/lib/pane-types';
import { AgentBrainPane } from './panes/AgentBrainPane';
import { AgentCallingPane } from './panes/AgentCallingPane';
import { AgentChatPane } from './panes/AgentChatPane';
import { AgentMemoryPane } from './panes/AgentMemoryPane';
import { AgentMetadataPane } from './panes/AgentMetadataPane';
import { AgentPersonaPane } from './panes/AgentPersonaPane';
import { AgentPhonePane } from './panes/AgentPhonePane';
import { AgentTextingPane } from './panes/AgentTextingPane';
import { AgentModelsPane } from './panes/AgentModelsPane';
import { AgentToolsPane } from './panes/AgentToolsPane';
import { AgentTrainingPane } from './panes/AgentTrainingPane';

const chat: PaneDefinition = {
  id: 'agents.chat',
  featureId: 'agents',
  label: 'Chat',
  defaultSpan: 'full',
  component: AgentChatPane,
};

const metadata: PaneDefinition = {
  id: 'agents.metadata',
  featureId: 'agents',
  label: 'Agent',
  defaultSpan: 'half',
  component: AgentMetadataPane,
};

const persona: PaneDefinition = {
  id: 'agents.persona',
  featureId: 'agents',
  label: 'Persona',
  defaultSpan: 'half',
  component: AgentPersonaPane,
};

const memory: PaneDefinition = {
  id: 'agents.memory',
  featureId: 'agents',
  label: 'Agent memory',
  defaultSpan: 'third',
  component: AgentMemoryPane,
};

const training: PaneDefinition = {
  id: 'agents.training',
  featureId: 'agents',
  label: 'Training',
  defaultSpan: 'third',
  component: AgentTrainingPane,
};

const brain: PaneDefinition = {
  id: 'agents.brain',
  featureId: 'agents',
  label: 'Brain',
  defaultSpan: 'third',
  component: AgentBrainPane,
};

const tools: PaneDefinition = {
  id: 'agents.tools',
  featureId: 'agents',
  label: 'Agent tools',
  defaultSpan: 'full',
  component: AgentToolsPane,
};

const models: PaneDefinition = {
  id: 'agents.models',
  featureId: 'agents',
  label: 'Models',
  defaultSpan: 'full',
  component: AgentModelsPane,
};

const phone: PaneDefinition = {
  id: 'agents.phone',
  featureId: 'agents',
  label: 'Phone',
  defaultSpan: 'half',
  component: AgentPhonePane,
};

const texting: PaneDefinition = {
  id: 'agents.texting',
  featureId: 'agents',
  label: 'Texting',
  defaultSpan: 'full',
  component: AgentTextingPane,
};

const calling: PaneDefinition = {
  id: 'agents.calling',
  featureId: 'agents',
  label: 'Calling',
  defaultSpan: 'half',
  component: AgentCallingPane,
};

const consoleStudio: StudioPreset = {
  id: 'agents.console',
  featureId: 'agents',
  label: 'Console',
  root: {
    type: 'split',
    direction: 'col',
    sizes: [4, 2, 1],
    children: [
      {
        type: 'split',
        direction: 'row',
        sizes: [3, 2],
        children: [
          { type: 'pane', paneId: chat.id },
          {
            type: 'split',
            direction: 'col',
            sizes: [1, 1],
            children: [
              { type: 'pane', paneId: metadata.id },
              { type: 'pane', paneId: persona.id },
            ],
          },
        ],
      },
      {
        type: 'split',
        direction: 'row',
        sizes: [1, 1, 1],
        children: [
          { type: 'pane', paneId: memory.id },
          { type: 'pane', paneId: training.id },
          { type: 'pane', paneId: brain.id },
        ],
      },
      { type: 'pane', paneId: tools.id },
      { type: 'pane', paneId: models.id },
    ],
  },
};

const communicationsStudio: StudioPreset = {
  id: 'agents.communications',
  featureId: 'agents',
  label: 'Communications',
  root: {
    type: 'split',
    direction: 'col',
    sizes: [3, 1],
    children: [
      { type: 'pane', paneId: texting.id },
      {
        type: 'split',
        direction: 'row',
        sizes: [1, 1],
        children: [
          { type: 'pane', paneId: phone.id },
          { type: 'pane', paneId: calling.id },
        ],
      },
    ],
  },
};

export const agentsFeatureCatalog: FeatureCatalog = {
  featureId: 'agents',
  label: 'Agents',
  panes: [chat, metadata, persona, memory, training, brain, tools, models, phone, texting, calling],
  studios: [consoleStudio, communicationsStudio],
};