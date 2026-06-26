import { NextRequest, NextResponse } from 'next/server';

type OrgNodeType = 'executive' | 'vp' | 'manager' | 'supervisor' | 'worker' | 'tool' | 'automation';

type OrgNode = {
  id: string;
  role: string;
  title: string;
  type: OrgNodeType;
  team?: string;
  model?: string;
  tool?: string;
};

type OrgEdge = {
  from: string;
  to: string;
  relation: 'manages' | 'approves' | 'delegates' | 'feeds';
};

type WorkflowDraft = {
  orgName: string;
  version: string;
  nodes: OrgNode[];
  edges: OrgEdge[];
  subgraphs: Array<{ id: string; purpose: string; owner: string; nodeIds: string[] }>;
  automations: Array<{ id: string; trigger: string; output: Record<string, unknown> }>;
};

function isWorkflowDraft(value: unknown): value is WorkflowDraft {
  if (!value || typeof value !== 'object') return false;
  const obj = value as Record<string, unknown>;
  return typeof obj.orgName === 'string'
    && typeof obj.version === 'string'
    && Array.isArray(obj.nodes)
    && Array.isArray(obj.edges)
    && Array.isArray(obj.subgraphs)
    && Array.isArray(obj.automations);
}

function compileWorkflowToLangGraphScript(draft: WorkflowDraft): string {
  const nodeFnLines = draft.nodes
    .filter(n => n.type !== 'tool')
    .map(n => {
      const label = `${n.role} (${n.type})`;
      return `builder.addNode('${n.id}', async (state) => ({ ...state, log: [...state.log, '${label} executed'] }));`;
    });

  const toolNote = draft.nodes
    .filter(n => n.type === 'tool')
    .map(n => `// tool: ${n.id} -> ${n.tool || n.title}`)
    .join('\n');

  const edgeLines = draft.edges.map(e => `builder.addEdge('${e.from}', '${e.to}');`);

  return `import { StateGraph, START, END, Annotation } from '@langchain/langgraph';
import { ChatOpenAI } from '@langchain/openai';

const model = new ChatOpenAI({
  model: process.env.CSUITE_MODEL || 'grok-4.3',
  apiKey: process.env.XAI_API_KEY,
  configuration: { baseURL: 'https://api.x.ai/v1' },
});

const WorkflowState = Annotation.Root({
  request: Annotation<string>(),
  log: Annotation<string[]>({
    reducer: (left, right) => [...left, ...right],
    default: () => [],
  }),
});

export const workflowMeta = ${JSON.stringify(
    {
      orgName: draft.orgName,
      version: draft.version,
      subgraphs: draft.subgraphs,
      automations: draft.automations,
    },
    null,
    2
  )};

const builder = new StateGraph(WorkflowState);

${nodeFnLines.join('\n')}

${edgeLines.join('\n')}

builder.addEdge(START, '${draft.nodes[0]?.id || 'ceo'}');
builder.addEdge('${draft.nodes[draft.nodes.length - 1]?.id || 'ceo'}', END);

export const enterpriseGraph = builder.compile();

${toolNote}

// LangSmith tracing:
// LANGCHAIN_TRACING_V2=true
// LANGCHAIN_API_KEY=...
// LANGCHAIN_PROJECT=${draft.orgName.replace(/\s+/g, '-')}
`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!isWorkflowDraft(body)) {
      return NextResponse.json({ ok: false, error: 'Invalid workflow schema' }, { status: 400 });
    }

    if (body.nodes.length === 0) {
      return NextResponse.json({ ok: false, error: 'At least one node is required' }, { status: 400 });
    }

    const script = compileWorkflowToLangGraphScript(body);
    return NextResponse.json({ ok: true, workflow: body, script });
  } catch (error: unknown) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Compile failed' },
      { status: 500 }
    );
  }
}
