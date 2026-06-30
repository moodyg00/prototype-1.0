import type { NodeTypeDefinition } from './types';

export const NODE_CATALOG: NodeTypeDefinition[] = [
  // ── Triggers ───────────────────────────────────────────────────────────────
  {
    type: 'trigger.manual',
    label: 'Manual Trigger',
    category: 'trigger',
    description: 'Starts the workflow on demand.',
    color: '#6366f1',
    icon: 'Play',
    handles: [{ id: 'out', direction: 'output', dataType: 'any', label: 'Output' }],
    properties: [
      { key: 'payload', label: 'Initial Payload (JSON)', type: 'json', default: '{}', group: 'Config' },
    ],
    langGraphKind: 'node',
  },
  {
    type: 'trigger.webhook',
    label: 'Webhook',
    category: 'trigger',
    description: 'Receives an HTTP POST payload to start the workflow.',
    color: '#6366f1',
    icon: 'Webhook',
    handles: [{ id: 'out', direction: 'output', dataType: 'object', label: 'Payload' }],
    properties: [
      { key: 'path', label: 'Path', type: 'string', default: '/webhook', required: true, group: 'Config' },
      { key: 'secret', label: 'Secret Header', type: 'string', placeholder: 'X-Signature-256', group: 'Security' },
    ],
    langGraphKind: 'node',
  },
  {
    type: 'trigger.schedule',
    label: 'Schedule',
    category: 'trigger',
    description: 'Triggers the workflow on a cron schedule.',
    color: '#6366f1',
    icon: 'Clock',
    handles: [{ id: 'out', direction: 'output', dataType: 'any', label: 'Tick' }],
    properties: [
      { key: 'cron', label: 'Cron Expression', type: 'string', default: '0 9 * * 1-5', required: true, group: 'Schedule' },
      { key: 'timezone', label: 'Timezone', type: 'string', default: 'UTC', group: 'Schedule' },
    ],
    langGraphKind: 'node',
  },
  {
    type: 'trigger.memory_ingest',
    label: 'Memory Ingest',
    category: 'trigger',
    description: 'Starts a memory ingest pipeline with text and scope in the trigger payload.',
    color: '#6366f1',
    icon: 'Database',
    handles: [{ id: 'out', direction: 'output', dataType: 'object', label: 'Payload' }],
    properties: [
      { key: 'payload', label: 'Default Payload (JSON)', type: 'json', default: '{"text":"","scopeKind":"global"}', group: 'Config' },
      { key: 'scopeKind', label: 'Scope Kind', type: 'select', default: 'global', group: 'Scope',
        options: [
          { value: 'global', label: 'global' },
          { value: 'agent', label: 'agent' },
          { value: 'group', label: 'group' },
        ]},
      { key: 'scopeId', label: 'Scope ID (agent/group)', type: 'string', placeholder: 'cfo', group: 'Scope' },
      { key: 'sourceKind', label: 'Source Kind', type: 'select', default: 'domain', group: 'Scope',
        options: [
          { value: 'turn', label: 'turn' },
          { value: 'thought', label: 'thought' },
          { value: 'seed', label: 'seed' },
          { value: 'domain', label: 'domain' },
          { value: 'fact', label: 'fact' },
        ]},
    ],
    langGraphKind: 'node',
  },

  // ── LLM ────────────────────────────────────────────────────────────────────
  {
    type: 'llm.chat',
    label: 'Chat Model',
    category: 'llm',
    description: 'Calls a chat completion model with a system prompt and input.',
    color: '#8b5cf6',
    icon: 'MessageSquare',
    handles: [
      { id: 'in', direction: 'input', dataType: 'chat', label: 'Messages' },
      { id: 'out', direction: 'output', dataType: 'string', label: 'Response' },
    ],
    properties: [
      { key: 'model', label: 'Model', type: 'select', default: 'grok-3-mini', required: true, group: 'Model',
        options: [
          { value: 'grok-3', label: 'grok-3' },
          { value: 'grok-3-mini', label: 'grok-3-mini' },
          { value: 'grok-3-fast', label: 'grok-3-fast' },
          { value: 'grok-4', label: 'grok-4' },
        ]},
      { key: 'systemPrompt', label: 'System Prompt', type: 'textarea', default: 'You are a helpful assistant.', group: 'Prompt' },
      { key: 'temperature', label: 'Temperature', type: 'number', default: 0.7, group: 'Model' },
      { key: 'maxTokens', label: 'Max Tokens', type: 'number', default: 1024, group: 'Model' },
    ],
    langGraphKind: 'node',
  },
  {
    type: 'llm.agent',
    label: 'Agent',
    category: 'llm',
    description: 'A model node that can call tools in a loop (ReAct pattern).',
    color: '#7c3aed',
    icon: 'Bot',
    handles: [
      { id: 'in', direction: 'input', dataType: 'chat', label: 'Messages' },
      { id: 'tools', direction: 'input', dataType: 'tool', label: 'Tools', required: false, maxConnections: 10 },
      { id: 'out', direction: 'output', dataType: 'chat', label: 'Messages' },
    ],
    properties: [
      { key: 'model', label: 'Model', type: 'select', default: 'grok-3-mini', required: true, group: 'Model',
        options: [
          { value: 'grok-3', label: 'grok-3' },
          { value: 'grok-3-mini', label: 'grok-3-mini' },
          { value: 'grok-4', label: 'grok-4' },
        ]},
      { key: 'systemPrompt', label: 'System Prompt', type: 'textarea', group: 'Prompt' },
      { key: 'maxIterations', label: 'Max Iterations', type: 'number', default: 10, group: 'Model' },
    ],
    langGraphKind: 'node',
  },

  // ── Tools ───────────────────────────────────────────────────────────────────
  {
    type: 'tool.http',
    label: 'HTTP Request',
    category: 'tool',
    description: 'Makes an HTTP request and returns the response body.',
    color: '#0ea5e9',
    icon: 'Globe',
    handles: [
      { id: 'in', direction: 'input', dataType: 'any', label: 'Input' },
      { id: 'out', direction: 'output', dataType: 'object', label: 'Response' },
    ],
    properties: [
      { key: 'method', label: 'Method', type: 'select', default: 'GET', required: true, group: 'Request',
        options: [
          { value: 'GET', label: 'GET' },
          { value: 'POST', label: 'POST' },
          { value: 'PUT', label: 'PUT' },
          { value: 'PATCH', label: 'PATCH' },
          { value: 'DELETE', label: 'DELETE' },
        ]},
      { key: 'url', label: 'URL', type: 'string', required: true, placeholder: 'https://...', group: 'Request' },
      { key: 'headers', label: 'Headers (JSON)', type: 'json', default: '{}', group: 'Request' },
      { key: 'body', label: 'Body (JSON)', type: 'json', default: 'null', group: 'Request' },
    ],
    langGraphKind: 'tool',
  },
  {
    type: 'tool.code',
    label: 'Code',
    category: 'tool',
    description: 'Runs a TypeScript/JavaScript function over the input.',
    color: '#0ea5e9',
    icon: 'Code',
    handles: [
      { id: 'in', direction: 'input', dataType: 'any', label: 'Input' },
      { id: 'out', direction: 'output', dataType: 'any', label: 'Output' },
    ],
    properties: [
      { key: 'code', label: 'Function Body', type: 'code', required: true,
        default: 'async function run(input) {\n  return input;\n}', group: 'Logic' },
      { key: 'timeout', label: 'Timeout (ms)', type: 'number', default: 5000, group: 'Config' },
    ],
    langGraphKind: 'tool',
  },

  {
    type: 'tool.browser',
    label: 'Browser Agent',
    category: 'tool',
    description: 'Runs the visual browser agent (Playwright + xAI vision) on a task — navigation, login, extraction, and bounded reasoning loop — and returns its final answer.',
    color: '#0ea5e9',
    icon: 'Globe',
    handles: [
      { id: 'in', direction: 'input', dataType: 'any', label: 'Task' },
      { id: 'out', direction: 'output', dataType: 'string', label: 'Result' },
    ],
    properties: [
      { key: 'task', label: 'Task (optional, overrides input)', type: 'textarea',
        placeholder: 'Leave blank to use the workflow input as the task.', group: 'Task' },
      { key: 'model', label: 'Model', type: 'string', default: 'grok-4.3', group: 'Model' },
      { key: 'maxSteps', label: 'Max Steps', type: 'number', default: 30, group: 'Config' },
    ],
    langGraphKind: 'tool',
  },

  // ── Transform ───────────────────────────────────────────────────────────────
  {
    type: 'transform.extract',
    label: 'Extract Fields',
    category: 'transform',
    description: 'Plucks specific keys from an object into a new shape.',
    color: '#10b981',
    icon: 'Filter',
    handles: [
      { id: 'in', direction: 'input', dataType: 'object', label: 'Input' },
      { id: 'out', direction: 'output', dataType: 'object', label: 'Output' },
    ],
    properties: [
      { key: 'mapping', label: 'Field Mapping (JSON)', type: 'json',
        default: '{"outputKey": "$.inputPath"}', group: 'Mapping' },
    ],
    langGraphKind: 'node',
  },
  {
    type: 'transform.template',
    label: 'Template',
    category: 'transform',
    description: 'Renders a Handlebars-style template string from context variables.',
    color: '#10b981',
    icon: 'FileText',
    handles: [
      { id: 'in', direction: 'input', dataType: 'object', label: 'Context' },
      { id: 'out', direction: 'output', dataType: 'string', label: 'Rendered' },
    ],
    properties: [
      { key: 'template', label: 'Template', type: 'textarea', required: true,
        default: 'Hello {{name}}!', group: 'Template' },
    ],
    langGraphKind: 'node',
  },

  // ── Logic ───────────────────────────────────────────────────────────────────
  {
    type: 'logic.condition',
    label: 'Condition',
    category: 'logic',
    description: 'Routes execution based on a boolean expression.',
    color: '#f59e0b',
    icon: 'GitBranch',
    handles: [
      { id: 'in', direction: 'input', dataType: 'any', label: 'Input' },
      { id: 'true', direction: 'output', dataType: 'any', label: 'True' },
      { id: 'false', direction: 'output', dataType: 'any', label: 'False' },
    ],
    properties: [
      { key: 'expression', label: 'Expression', type: 'code', required: true,
        default: 'input.value > 0', group: 'Logic' },
    ],
    langGraphKind: 'conditional',
  },
  {
    type: 'logic.merge',
    label: 'Merge',
    category: 'logic',
    description: 'Waits for all upstream branches and merges their outputs.',
    color: '#f59e0b',
    icon: 'Merge',
    handles: [
      { id: 'a', direction: 'input', dataType: 'any', label: 'Branch A' },
      { id: 'b', direction: 'input', dataType: 'any', label: 'Branch B' },
      { id: 'out', direction: 'output', dataType: 'object', label: 'Merged' },
    ],
    properties: [],
    langGraphKind: 'node',
  },

  // ── Memory ──────────────────────────────────────────────────────────────────
  {
    type: 'memory.buffer',
    label: 'Buffer Memory',
    category: 'memory',
    description: 'Stores and retrieves a sliding window of conversation messages.',
    color: '#ec4899',
    icon: 'Database',
    handles: [
      { id: 'in', direction: 'input', dataType: 'chat', label: 'New Message' },
      { id: 'out', direction: 'output', dataType: 'chat', label: 'History' },
    ],
    properties: [
      { key: 'windowSize', label: 'Window Size', type: 'number', default: 20, group: 'Config' },
    ],
    langGraphKind: 'node',
  },
  {
    type: 'memory.shard',
    label: 'Shard Text',
    category: 'memory',
    description: 'Split raw text into chunks for vector ingest.',
    color: '#ec4899',
    icon: 'Scissors',
    handles: [
      { id: 'in', direction: 'input', dataType: 'string', label: 'Text' },
      { id: 'out', direction: 'output', dataType: 'array', label: 'Chunks' },
    ],
    properties: [
      { key: 'maxChars', label: 'Max Chars / Chunk', type: 'number', default: 1200, group: 'Config' },
      { key: 'scopeKind', label: 'Scope Kind', type: 'select', default: 'global', group: 'Scope',
        options: [
          { value: 'global', label: 'global' },
          { value: 'agent', label: 'agent' },
          { value: 'group', label: 'group' },
        ]},
      { key: 'scopeId', label: 'Scope ID', type: 'string', group: 'Scope' },
      { key: 'sourceKind', label: 'Source Kind', type: 'select', default: 'domain', group: 'Scope',
        options: [
          { value: 'domain', label: 'domain' },
          { value: 'seed', label: 'seed' },
          { value: 'turn', label: 'turn' },
        ]},
    ],
    langGraphKind: 'node',
  },
  {
    type: 'memory.tag',
    label: 'Tag Chunks',
    category: 'memory',
    description: 'Apply scope, partition, and labels to memory chunks.',
    color: '#ec4899',
    icon: 'Tags',
    handles: [
      { id: 'in', direction: 'input', dataType: 'array', label: 'Chunks' },
      { id: 'out', direction: 'output', dataType: 'array', label: 'Tagged' },
    ],
    properties: [
      { key: 'partition', label: 'Partition', type: 'string', default: 'default', group: 'Tags' },
      { key: 'agentId', label: 'Agent ID', type: 'string', group: 'Tags' },
      { key: 'sourceKind', label: 'Source Kind', type: 'select', default: 'domain', group: 'Tags',
        options: [
          { value: 'domain', label: 'domain' },
          { value: 'seed', label: 'seed' },
          { value: 'fact', label: 'fact' },
        ]},
    ],
    langGraphKind: 'node',
  },
  {
    type: 'memory.embed',
    label: 'Embed Chunks',
    category: 'memory',
    description: 'Compute embedding vectors for tagged chunks (stub embedder until configured).',
    color: '#ec4899',
    icon: 'Binary',
    handles: [
      { id: 'in', direction: 'input', dataType: 'array', label: 'Chunks' },
      { id: 'out', direction: 'output', dataType: 'array', label: 'Embedded' },
    ],
    properties: [],
    langGraphKind: 'node',
  },
  {
    type: 'memory.chroma_upsert',
    label: 'Chroma Upsert',
    category: 'memory',
    description: 'Upsert embedded chunks into Chroma (or mock store when CHROMA_URL unset).',
    color: '#ec4899',
    icon: 'Upload',
    handles: [
      { id: 'in', direction: 'input', dataType: 'array', label: 'Chunks' },
      { id: 'out', direction: 'output', dataType: 'object', label: 'Result' },
    ],
    properties: [
      { key: 'partition', label: 'Partition', type: 'string', default: 'default', group: 'Chroma' },
    ],
    langGraphKind: 'node',
  },
  {
    type: 'memory.chroma_recall',
    label: 'Chroma Recall',
    category: 'memory',
    description: 'Semantic recall from Chroma scoped to agent + global.',
    color: '#ec4899',
    icon: 'Search',
    handles: [
      { id: 'in', direction: 'input', dataType: 'string', label: 'Query' },
      { id: 'out', direction: 'output', dataType: 'array', label: 'Hits' },
    ],
    properties: [
      { key: 'query', label: 'Query (optional)', type: 'string', placeholder: 'Uses workflow input if empty', group: 'Recall' },
      { key: 'agentId', label: 'Agent ID', type: 'string', default: 'default', group: 'Recall' },
      { key: 'topK', label: 'Top K', type: 'number', default: 8, group: 'Recall' },
      { key: 'scopeKind', label: 'Primary Scope', type: 'select', default: 'agent', group: 'Recall',
        options: [
          { value: 'global', label: 'global' },
          { value: 'agent', label: 'agent' },
          { value: 'group', label: 'group' },
        ]},
      { key: 'scopeId', label: 'Scope ID', type: 'string', default: 'default', group: 'Recall' },
    ],
    langGraphKind: 'node',
  },

  // ── Output ──────────────────────────────────────────────────────────────────
  {
    type: 'output.terminal',
    label: 'Output',
    category: 'output',
    description: 'Terminal sink — marks the end of a workflow path.',
    color: '#64748b',
    icon: 'Square',
    handles: [{ id: 'in', direction: 'input', dataType: 'any', label: 'Result' }],
    properties: [
      { key: 'label', label: 'Output Label', type: 'string', default: 'result', group: 'Config' },
    ],
    langGraphKind: 'node',
  },
  {
    type: 'output.respond',
    label: 'Respond',
    category: 'output',
    description: 'Returns a response to the caller (webhook, chat, or API).',
    color: '#64748b',
    icon: 'Send',
    handles: [{ id: 'in', direction: 'input', dataType: 'any', label: 'Body' }],
    properties: [
      { key: 'statusCode', label: 'Status Code', type: 'number', default: 200, group: 'Config' },
      { key: 'contentType', label: 'Content-Type', type: 'string', default: 'application/json', group: 'Config' },
    ],
    langGraphKind: 'node',
  },

  // ── LangGraph-specific ──────────────────────────────────────────────────────
  {
    type: 'langgraph.toolNode',
    label: 'Tool Node',
    category: 'langgraph',
    description: 'Runs tool calls returned by the preceding agent node.',
    color: '#d97706',
    icon: 'Wrench',
    handles: [
      { id: 'in', direction: 'input', dataType: 'chat', label: 'Messages' },
      { id: 'out', direction: 'output', dataType: 'chat', label: 'Messages' },
    ],
    properties: [],
    langGraphKind: 'tool',
  },
  {
    type: 'langgraph.interrupt',
    label: 'Human-in-Loop',
    category: 'langgraph',
    description: 'Pauses graph execution and waits for human approval or input.',
    color: '#d97706',
    icon: 'Pause',
    handles: [
      { id: 'in', direction: 'input', dataType: 'any', label: 'State' },
      { id: 'out', direction: 'output', dataType: 'any', label: 'Resumed' },
    ],
    properties: [
      { key: 'prompt', label: 'Review Prompt', type: 'textarea',
        default: 'Please review and approve.', group: 'Config' },
    ],
    langGraphKind: 'interrupt',
  },
  {
    type: 'langgraph.subgraph',
    label: 'Subgraph',
    category: 'langgraph',
    description: 'Embeds another workflow as a compiled subgraph.',
    color: '#d97706',
    icon: 'Network',
    handles: [
      { id: 'in', direction: 'input', dataType: 'any', label: 'State' },
      { id: 'out', direction: 'output', dataType: 'any', label: 'State' },
    ],
    properties: [
      { key: 'workflowId', label: 'Workflow ID', type: 'string', required: true, group: 'Config' },
    ],
    langGraphKind: 'subgraph',
  },
];

export const CATALOG_BY_TYPE = Object.fromEntries(NODE_CATALOG.map(n => [n.type, n]));

export const CATALOG_BY_CATEGORY = NODE_CATALOG.reduce<Record<string, NodeTypeDefinition[]>>(
  (acc, n) => {
    if (!acc[n.category]) acc[n.category] = [];
    acc[n.category].push(n);
    return acc;
  },
  {},
);

export const CATEGORY_ORDER = ['trigger', 'llm', 'tool', 'transform', 'logic', 'memory', 'output', 'langgraph'] as const;
export const CATEGORY_LABELS: Record<string, string> = {
  trigger: 'Triggers',
  llm: 'Language Models',
  tool: 'Tools',
  transform: 'Transform',
  logic: 'Logic',
  memory: 'Memory',
  output: 'Output',
  langgraph: 'LangGraph',
};
