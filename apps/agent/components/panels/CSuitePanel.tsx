"use client";

import React, { useMemo, useState } from 'react';
import { Building2, Users, GitBranch, FileJson2, Link as LinkIcon, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

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

type CompileResponse = {
  ok: boolean;
  workflow?: WorkflowDraft;
  script?: string;
  error?: string;
};

const defaultDraft: WorkflowDraft = {
  orgName: 'Agentic Enterprise',
  version: '0.1.0',
  nodes: [
    { id: 'ceo', role: 'CEO', title: 'Chief Executive Officer', type: 'executive', model: 'grok-4.3' },
    { id: 'cfo', role: 'CFO', title: 'Chief Financial Officer', type: 'executive', model: 'grok-4.3' },
    { id: 'cto', role: 'CTO', title: 'Chief Technology Officer', type: 'executive', model: 'grok-4.3' },
    { id: 'clo', role: 'CLO', title: 'Chief Legal Officer', type: 'executive', model: 'grok-4.3' },
    { id: 'coo', role: 'COO', title: 'Chief Operating Officer', type: 'executive', model: 'grok-4.3' },
    { id: 'vp-finance', role: 'VP Finance', title: 'Finance Strategy and Controls', type: 'vp', team: 'Finance Ops' },
    { id: 'vp-engineering', role: 'VP Engineering', title: 'Platform and Product Delivery', type: 'vp', team: 'Technology' },
    { id: 'ops-supervisor', role: 'Ops Supervisor', title: 'Daily Operations Supervisor', type: 'supervisor', team: 'Operations' },
    { id: 'workflow-worker', role: 'Workflow Worker', title: 'Automation Worker', type: 'worker', team: 'Automation' },
    { id: 'erp-tool', role: 'ERP Tool', title: 'ERP Integration Tool', type: 'tool', tool: 'ERP Connector' },
  ],
  edges: [
    { from: 'ceo', to: 'cfo', relation: 'delegates' },
    { from: 'ceo', to: 'cto', relation: 'delegates' },
    { from: 'ceo', to: 'clo', relation: 'delegates' },
    { from: 'ceo', to: 'coo', relation: 'delegates' },
    { from: 'cfo', to: 'vp-finance', relation: 'manages' },
    { from: 'cto', to: 'vp-engineering', relation: 'manages' },
    { from: 'coo', to: 'ops-supervisor', relation: 'manages' },
    { from: 'ops-supervisor', to: 'workflow-worker', relation: 'delegates' },
    { from: 'workflow-worker', to: 'erp-tool', relation: 'feeds' },
  ],
  subgraphs: [
    { id: 'budgeting', purpose: 'Forecast + variance handling', owner: 'cfo', nodeIds: ['cfo', 'vp-finance', 'erp-tool'] },
    { id: 'delivery', purpose: 'Roadmap to release execution', owner: 'cto', nodeIds: ['cto', 'vp-engineering', 'workflow-worker'] },
  ],
  automations: [
    {
      id: 'daily-kpi',
      trigger: '0 7 * * *',
      output: {
        boardPacket: true,
        include: ['cash_position', 'pipeline_health', 'delivery_risk'],
      },
    },
  ],
};

export function CSuitePanel() {
  const [tab, setTab] = useState<'meeting' | 'graph' | 'flowise' | 'build'>('meeting');
  const [draftText, setDraftText] = useState(JSON.stringify(defaultDraft, null, 2));
  const [flowiseUrl, setFlowiseUrl] = useState('http://localhost:3001');
  const [scriptPreview, setScriptPreview] = useState('');
  const [compileBusy, setCompileBusy] = useState(false);

  const parsed = useMemo(() => {
    try {
      return JSON.parse(draftText) as WorkflowDraft;
    } catch {
      return null;
    }
  }, [draftText]);

  const executives = (parsed?.nodes ?? []).filter(n => n.type === 'executive');
  const leadership = (parsed?.nodes ?? []).filter(n => n.type === 'vp' || n.type === 'manager' || n.type === 'supervisor');

  const compileDraft = async () => {
    if (!parsed) {
      toast.error('Fix JSON before compiling');
      return;
    }
    setCompileBusy(true);
    try {
      const res = await fetch('/api/csuite/compile', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(parsed),
      });
      const body = (await res.json()) as CompileResponse;
      if (!res.ok || !body.ok || !body.script) {
        throw new Error(body.error || 'Compile failed');
      }
      setScriptPreview(body.script);
      toast.success('LangGraph scaffold generated');
      setTab('build');
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Compile failed');
    } finally {
      setCompileBusy(false);
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-[#09090b]">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center">
            <Building2 size={15} className="text-zinc-300" />
          </div>
          <div className="min-w-0">
            <div className="text-sm text-zinc-100 font-medium truncate">C-Suite Command</div>
            <div className="text-[10px] text-zinc-500 truncate">Executive meeting room + org graph + LangGraph pipeline</div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button className={`btn btn-ghost !text-[10px] ${tab === 'meeting' ? '!bg-white/10' : ''}`} onClick={() => setTab('meeting')}>
            <Users size={12} /> Meeting
          </button>
          <button className={`btn btn-ghost !text-[10px] ${tab === 'graph' ? '!bg-white/10' : ''}`} onClick={() => setTab('graph')}>
            <GitBranch size={12} /> Graph JSON
          </button>
          <button className={`btn btn-ghost !text-[10px] ${tab === 'flowise' ? '!bg-white/10' : ''}`} onClick={() => setTab('flowise')}>
            <LinkIcon size={12} /> Flowise
          </button>
          <button className={`btn btn-ghost !text-[10px] ${tab === 'build' ? '!bg-white/10' : ''}`} onClick={() => setTab('build')}>
            <FileJson2 size={12} /> Build
          </button>
        </div>
      </div>

      {tab === 'meeting' && (
        <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
          <div className="rounded-xl border border-white/10 bg-gradient-to-b from-zinc-900 to-black p-4">
            <div className="text-xs uppercase tracking-widest text-zinc-500 mb-3">Executive Room</div>
            <div className="grid grid-cols-2 xl:grid-cols-5 gap-3">
              {executives.map(exec => (
                <div key={exec.id} className="rounded-lg border border-white/10 bg-black/30 p-3">
                  <div className="text-[10px] text-zinc-500 uppercase tracking-wider">{exec.role}</div>
                  <div className="text-sm text-zinc-100 mt-1">{exec.title}</div>
                  <div className="text-[10px] text-zinc-500 mt-2">{exec.model || 'grok'}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-black/25 p-4">
            <div className="text-xs uppercase tracking-widest text-zinc-500 mb-3">VP / Management Layer</div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {leadership.map(node => (
                <div key={node.id} className="rounded-lg border border-white/10 p-3 bg-zinc-950/70">
                  <div className="text-xs text-zinc-100">{node.role}</div>
                  <div className="text-[11px] text-zinc-500 mt-1">{node.title}</div>
                  <div className="text-[10px] text-zinc-600 mt-2">{node.team || node.type}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'graph' && (
        <div className="flex-1 min-h-0 flex flex-col p-4 gap-3">
          <div className="text-[11px] text-zinc-500">Define nodes, subgraphs, edges, and non-agent automations as JSON.</div>
          <textarea
            value={draftText}
            onChange={e => setDraftText(e.target.value)}
            className="flex-1 min-h-0 w-full rounded-lg border border-white/10 bg-black/50 text-zinc-200 text-xs font-mono p-3 outline-none"
            spellCheck={false}
          />
          <div className="flex items-center justify-between">
            <div className="text-[10px] text-zinc-600">Invalid JSON blocks compile</div>
            <button onClick={compileDraft} disabled={compileBusy} className="btn btn-primary text-xs flex items-center gap-1.5">
              <Sparkles size={12} /> {compileBusy ? 'Compiling...' : 'Compile to LangGraph'}
            </button>
          </div>
        </div>
      )}

      {tab === 'flowise' && (
        <div className="flex-1 min-h-0 flex flex-col p-4 gap-3">
          <div className="flex gap-2">
            <input
              value={flowiseUrl}
              onChange={e => setFlowiseUrl(e.target.value)}
              className="input flex-1 text-xs"
              placeholder="http://localhost:3001"
            />
            <a href="https://github.com/FlowiseAI/Flowise" target="_blank" rel="noreferrer" className="btn btn-ghost text-xs">
              Flowise Repo
            </a>
          </div>
          <div className="flex-1 min-h-0 rounded-lg border border-white/10 overflow-hidden bg-black/40">
            <iframe src={flowiseUrl} className="w-full h-full" title="Flowise" />
          </div>
        </div>
      )}

      {tab === 'build' && (
        <div className="flex-1 min-h-0 flex flex-col p-4 gap-3">
          <div className="text-[11px] text-zinc-500">Approved JSON can be turned into code and committed when ready.</div>
          <textarea
            value={scriptPreview}
            onChange={e => setScriptPreview(e.target.value)}
            className="flex-1 min-h-0 w-full rounded-lg border border-white/10 bg-black/60 text-zinc-200 text-xs font-mono p-3 outline-none"
            placeholder="Compile from the Graph JSON tab to generate a LangGraph scaffold..."
            spellCheck={false}
          />
        </div>
      )}
    </div>
  );
}
