"use client";

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  AlertTriangle,
  CheckCircle2,
  Hammer,
  Pause,
  Play,
  RefreshCw,
  Square,
} from 'lucide-react';

type WorkflowSummary = {
  id: string;
  name: string;
  kind: string;
  currentVersion: number;
};

interface SerializedMessage {
  role: string;
  content: string;
}

interface SerializedState {
  input: string;
  output: string;
  messages: SerializedMessage[];
  memory: Record<string, unknown>;
  routeTo?: string;
}

interface RunEvent {
  node: string;
  update: SerializedState;
}

interface ValidationIssue {
  nodeId?: string;
  message: string;
}

interface ValidationResult {
  valid: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
}

interface RunResponse {
  status: 'completed' | 'interrupted' | 'error' | 'compiled';
  threadId?: string;
  events?: RunEvent[];
  state?: SerializedState;
  interrupt?: { node: string; prompt: string };
  validation?: ValidationResult;
  error?: string;
  ir?: { nodes: Array<{ id: string; label: string; kind: string }> };
}

type RunStatus = 'idle' | 'running' | 'completed' | 'interrupted' | 'error';

interface RunnerPanelProps {
  workflowId?: string;
  workflowName?: string;
  /** Hide the workflow selector when driven by a parent (e.g. WorkflowPanel Run tab). */
  lockWorkflow?: boolean;
}

const ROLE_COLORS: Record<string, string> = {
  system: 'text-amber-400',
  human: 'text-sky-400',
  ai: 'text-emerald-400',
  tool: 'text-violet-400',
};

export function RunnerPanel({ workflowId: workflowIdProp, workflowName, lockWorkflow }: RunnerPanelProps) {
  const [workflows, setWorkflows] = useState<WorkflowSummary[]>([]);
  const [workflowId, setWorkflowId] = useState<string | null>(workflowIdProp ?? null);

  const [input, setInput] = useState('');
  const [status, setStatus] = useState<RunStatus>('idle');
  const [busy, setBusy] = useState(false);
  const [events, setEvents] = useState<RunEvent[]>([]);
  const [finalState, setFinalState] = useState<SerializedState | null>(null);
  const [interrupt, setInterrupt] = useState<{ node: string; prompt: string } | null>(null);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [resumeValue, setResumeValue] = useState('');
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (workflowIdProp) setWorkflowId(workflowIdProp);
  }, [workflowIdProp]);

  const refreshWorkflows = useCallback(async () => {
    const res = await fetch('/api/workflow');
    if (!res.ok) return;
    const data = (await res.json()) as WorkflowSummary[];
    setWorkflows(data);
    if (!workflowIdProp && !workflowId && data.length > 0) {
      setWorkflowId(data[0].id);
    }
  }, [workflowId, workflowIdProp]);

  useEffect(() => {
    if (lockWorkflow) return;
    void refreshWorkflows();
  }, [lockWorkflow, refreshWorkflows]);

  const resetRun = useCallback(() => {
    setEvents([]);
    setFinalState(null);
    setInterrupt(null);
    setThreadId(null);
    setResumeValue('');
    setError(null);
  }, []);

  const applyResponse = useCallback((data: RunResponse) => {
    setEvents(data.events ?? []);
    setFinalState(data.state ?? null);
    setValidation(data.validation ?? null);
    setThreadId(data.threadId ?? null);
    if (data.status === 'interrupted' && data.interrupt) {
      setInterrupt(data.interrupt);
      setStatus('interrupted');
    } else if (data.status === 'completed') {
      setInterrupt(null);
      setStatus('completed');
    }
  }, []);

  const compile = useCallback(async () => {
    if (!workflowId) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/workflow/${workflowId}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ compileOnly: true }),
      });
      const data = (await res.json()) as RunResponse;
      setValidation(data.validation ?? null);
      if (!res.ok) {
        setError(data.error ?? 'Compile failed');
        toast.error(data.error ?? 'Compile failed');
        return;
      }
      const count = data.ir?.nodes?.length ?? 0;
      if (data.validation && !data.validation.valid) {
        toast.warning(`Compiled with ${data.validation.errors.length} error(s)`);
      } else {
        toast.success(`Compiled ${count} node(s)`);
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Compile failed';
      setError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }, [workflowId]);

  const run = useCallback(async () => {
    if (!workflowId) return;
    setBusy(true);
    setStatus('running');
    resetRun();
    try {
      const res = await fetch(`/api/workflow/${workflowId}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input }),
      });
      const data = (await res.json()) as RunResponse;
      if (!res.ok) {
        setStatus('error');
        setError(data.error ?? 'Run failed');
        setValidation(data.validation ?? null);
        toast.error(data.error ?? 'Run failed');
        return;
      }
      applyResponse(data);
      if (data.status === 'interrupted') toast.info('Paused for human input');
      else toast.success('Run completed');
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Run failed';
      setStatus('error');
      setError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }, [workflowId, input, resetRun, applyResponse]);

  const resume = useCallback(async () => {
    if (!workflowId || !threadId) return;
    setBusy(true);
    setStatus('running');
    setError(null);
    try {
      const res = await fetch(`/api/workflow/${workflowId}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resume: true, threadId, resumeValue }),
      });
      const data = (await res.json()) as RunResponse;
      if (!res.ok) {
        setStatus('error');
        setError(data.error ?? 'Resume failed');
        toast.error(data.error ?? 'Resume failed');
        return;
      }
      setResumeValue('');
      applyResponse(data);
      if (data.status === 'interrupted') toast.info('Paused again for human input');
      else toast.success('Run completed');
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Resume failed';
      setStatus('error');
      setError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }, [workflowId, threadId, resumeValue, applyResponse]);

  const activeName = useMemo(() => {
    if (workflowName && (lockWorkflow || workflowId === workflowIdProp)) return workflowName;
    return workflows.find(w => w.id === workflowId)?.name ?? 'Workflow';
  }, [workflowName, lockWorkflow, workflowId, workflowIdProp, workflows]);

  const statusBadge = useMemo(() => {
    switch (status) {
      case 'running':
        return { label: 'Running', cls: 'text-amber-400', Icon: RefreshCw, spin: true };
      case 'completed':
        return { label: 'Completed', cls: 'text-emerald-400', Icon: CheckCircle2, spin: false };
      case 'interrupted':
        return { label: 'Interrupted', cls: 'text-sky-400', Icon: Pause, spin: false };
      case 'error':
        return { label: 'Error', cls: 'text-red-400', Icon: AlertTriangle, spin: false };
      default:
        return { label: 'Idle', cls: 'text-zinc-500', Icon: Square, spin: false };
    }
  }, [status]);

  const Badge = statusBadge.Icon;

  return (
    <div className="h-full flex flex-col overflow-hidden bg-zinc-950">
      <div className="h-11 border-b border-white/10 px-3 flex items-center gap-2">
        <div className="w-7 h-7 rounded-md border border-white/10 bg-white/5 flex items-center justify-center">
          <Play size={13} className="text-zinc-300" />
        </div>
        <span className="text-sm text-zinc-100 truncate max-w-48">{activeName}</span>
        {!lockWorkflow && (
          <select
            value={workflowId ?? ''}
            onChange={e => { setWorkflowId(e.target.value); resetRun(); setStatus('idle'); }}
            className="ml-1 bg-white/5 border border-white/10 text-xs text-zinc-300 rounded px-2 py-1"
          >
            {workflows.map(w => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
        )}
        <div className="flex items-center gap-1.5 ml-2 text-[11px] font-medium">
          <Badge size={12} className={`${statusBadge.cls} ${statusBadge.spin ? 'animate-spin' : ''}`} />
          <span className={statusBadge.cls}>{statusBadge.label}</span>
        </div>
        <div className="flex-1" />
        <button onClick={compile} disabled={!workflowId || busy} className="btn btn-ghost text-xs" title="Compile">
          <Hammer size={12} /> Compile
        </button>
        <button onClick={run} disabled={!workflowId || busy} className="btn btn-primary text-xs" title="Run">
          <Play size={12} className={busy && status === 'running' ? 'animate-pulse' : ''} /> Run
        </button>
      </div>

      <div className="flex-1 min-h-0 flex">
        {/* Controls */}
        <div className="w-72 min-w-72 border-r border-white/5 p-3 flex flex-col gap-3 overflow-y-auto">
          <div>
            <label className="block text-[10px] font-medium text-zinc-500 mb-1 uppercase tracking-wider">Input</label>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              rows={5}
              placeholder="Initial input passed to the graph..."
              className="w-full bg-zinc-900 border border-white/10 rounded text-xs text-zinc-200 px-2 py-1.5 outline-none focus:border-white/25 resize-none"
            />
          </div>

          {validation && (validation.errors.length > 0 || validation.warnings.length > 0) && (
            <div className="space-y-1.5">
              {validation.errors.map((err, i) => (
                <div key={`e${i}`} className="bg-red-500/10 border border-red-500/20 rounded p-2 text-[11px] text-red-400">
                  {err.message}
                </div>
              ))}
              {validation.warnings.map((warn, i) => (
                <div key={`w${i}`} className="bg-amber-500/10 border border-amber-500/20 rounded p-2 text-[11px] text-amber-400">
                  {warn.message}
                </div>
              ))}
            </div>
          )}

          {interrupt && (
            <div className="bg-sky-500/10 border border-sky-500/20 rounded p-2.5 space-y-2">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-sky-300">
                <Pause size={12} /> Human-in-the-loop
              </div>
              <p className="text-[11px] text-zinc-300">{interrupt.prompt}</p>
              <p className="text-[10px] text-zinc-500 font-mono">node: {interrupt.node}</p>
              <textarea
                value={resumeValue}
                onChange={e => setResumeValue(e.target.value)}
                rows={3}
                placeholder="Optional input to inject before resuming..."
                className="w-full bg-zinc-900 border border-white/10 rounded text-xs text-zinc-200 px-2 py-1.5 outline-none focus:border-white/25 resize-none"
              />
              <button onClick={resume} disabled={busy} className="btn btn-primary text-xs w-full justify-center">
                <Play size={12} /> Resume
              </button>
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded p-2 text-[11px] text-red-400">
              {error}
            </div>
          )}
        </div>

        {/* State viewer */}
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-4">
            {/* Output */}
            <section>
              <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-2 pb-1 border-b border-white/5">
                Output
              </div>
              {finalState?.output ? (
                <pre className="text-[11px] text-zinc-200 whitespace-pre-wrap break-words bg-zinc-900/60 rounded border border-white/5 p-2.5">
                  {finalState.output}
                </pre>
              ) : (
                <p className="text-[11px] text-zinc-600">No output yet. Run the workflow to see results.</p>
              )}
            </section>

            {/* Messages */}
            <section>
              <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-2 pb-1 border-b border-white/5">
                Messages ({finalState?.messages.length ?? 0})
              </div>
              <div className="space-y-1.5">
                {(finalState?.messages ?? []).map((m, i) => (
                  <div key={i} className="bg-zinc-900/60 rounded border border-white/5 p-2">
                    <div className={`text-[10px] font-semibold uppercase tracking-wider mb-0.5 ${ROLE_COLORS[m.role] ?? 'text-zinc-400'}`}>
                      {m.role}
                    </div>
                    <div className="text-[11px] text-zinc-300 whitespace-pre-wrap break-words">{m.content}</div>
                  </div>
                ))}
                {(!finalState || finalState.messages.length === 0) && (
                  <p className="text-[11px] text-zinc-600">No messages.</p>
                )}
              </div>
            </section>

            {/* Event timeline */}
            <section>
              <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-2 pb-1 border-b border-white/5">
                Node Timeline ({events.length})
              </div>
              <div className="space-y-1">
                {events.map((ev, i) => (
                  <div key={i} className="flex items-center gap-2 text-[11px]">
                    <span className="w-5 text-right text-zinc-600 font-mono">{i + 1}</span>
                    <span className="text-emerald-400">→</span>
                    <span className="text-zinc-300 font-mono">{ev.node}</span>
                    {ev.update.output && (
                      <span className="text-zinc-600 truncate">{ev.update.output.slice(0, 60)}</span>
                    )}
                  </div>
                ))}
                {events.length === 0 && <p className="text-[11px] text-zinc-600">No events.</p>}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
