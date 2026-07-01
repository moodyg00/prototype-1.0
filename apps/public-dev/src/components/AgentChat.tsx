'use client';

import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import {
  Bot,
  Check,
  ChevronDown,
  Copy,
  GitFork,
  ListTodo,
  Loader2,
  MessageSquarePlus,
  MousePointerClick,
  Send,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  Wrench,
} from 'lucide-react';
import { PaneZoomControls } from './PaneZoomControls';
import { usePaneZoom, usePaneZoomShortcuts } from '@/src/lib/usePaneZoom';
import type { DesignContext } from '@/src/lib/design-mode';
import {
  DEFAULT_IDE_MODEL_ID,
  ideModelStorageKey,
  normalizeIdeModelId,
  resolveIdeModel,
  type IdeModelOption,
} from '@prototype/ide-tools/ide-models';
import type { AgentTodoItem, ThoughtStep, ToolEvent } from '@prototype/ide-tools/types';

type ChatMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
  tools?: ToolEvent[];
  thoughts?: ThoughtStep[];
  designNote?: string;
  feedback?: 'up' | 'down';
  createdAt?: string;
  tokens?: number;
  contextWindow?: number;
};

function estimateTokens(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return Math.max(1, Math.ceil(trimmed.length / 4));
}

function formatCompactDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return '';
  }
}

function formatTokenCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 10_000) return `${Math.round(n / 1000)}k`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function computeSessionTokenStats(messages: ChatMessage[], fallbackContextWindow: number) {
  let totalTokens = 0;
  let contextWindow: number | undefined;
  for (const m of messages) {
    totalTokens += m.tokens ?? 0;
    if (m.contextWindow) contextWindow = m.contextWindow;
  }
  return {
    totalTokens,
    contextUsed: totalTokens,
    contextWindow: contextWindow ?? fallbackContextWindow,
  };
}

type SessionMeta = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
};

type SessionDetail = SessionMeta & {
  messages: ChatMessage[];
  threadId?: string;
  todos?: AgentTodoItem[];
};

type ModelOption = IdeModelOption & { configured?: boolean };

export type AgentChatHandle = {
  submitWithDesign: (prompt: string, design: DesignContext) => Promise<void>;
};

function ThoughtTrace({ thoughts }: { thoughts: ThoughtStep[] }) {
  const [open, setOpen] = useState(false);
  const reasoning = thoughts.filter((t) => t.reasoning);
  if (!reasoning.length) return null;
  return (
    <div className="mt-2 border-t border-[var(--color-border)] pt-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 text-[0.8em] text-[var(--color-muted)] hover:text-[var(--color-fg)]"
      >
        <Sparkles size={11} />
        Thinking ({reasoning.length} step{reasoning.length === 1 ? '' : 's'})
        <ChevronDown size={11} className={open ? 'rotate-180' : ''} />
      </button>
      {open && (
        <div className="mt-1 max-h-40 space-y-2 overflow-auto text-[0.8em] text-[var(--color-muted)]">
          {reasoning.map((t) => (
            <div key={t.step} className="whitespace-pre-wrap rounded bg-[var(--color-panel)] p-2">
              {t.reasoning}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MessageActions({
  align,
  feedback,
  copied,
  onCopy,
  onLike,
  onDislike,
  onFork,
  createdAt,
  tokens,
  contextUsed,
  contextWindow,
}: {
  align: 'left' | 'right';
  feedback?: 'up' | 'down';
  copied: boolean;
  onCopy: () => void;
  onLike: () => void;
  onDislike: () => void;
  onFork: () => void;
  createdAt?: string;
  tokens?: number;
  contextUsed?: number;
  contextWindow?: number;
}) {
  const btn =
    'rounded p-1 text-[var(--color-muted)] transition-colors hover:bg-[var(--color-panel)] hover:text-[var(--color-fg)]';
  const activeUp = feedback === 'up' ? 'text-[var(--color-accent)]' : '';
  const activeDown = feedback === 'down' ? 'text-[var(--color-danger)]' : '';

  const metaParts: string[] = [];
  if (createdAt) metaParts.push(formatCompactDate(createdAt));
  if (tokens != null) metaParts.push(`${formatTokenCount(tokens)} tok`);
  if (contextUsed != null && contextWindow) {
    metaParts.push(`${formatTokenCount(contextUsed)}/${formatTokenCount(contextWindow)} ctx`);
  } else if (contextWindow) {
    metaParts.push(`${formatTokenCount(contextWindow)} ctx max`);
  }

  return (
    <div
      className={`mt-1 flex flex-wrap items-center gap-1 transition-opacity ${
        feedback ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
      } ${align === 'right' ? 'justify-end' : 'justify-start'}`}
    >
      <div className="flex items-center gap-0.5">
        <button type="button" className={`${btn} ${activeUp}`} title="Like" onClick={onLike}>
          <ThumbsUp size={12} />
        </button>
        <button type="button" className={`${btn} ${activeDown}`} title="Dislike" onClick={onDislike}>
          <ThumbsDown size={12} />
        </button>
        <button type="button" className={btn} title="Fork chat from here" onClick={onFork}>
          <GitFork size={12} />
        </button>
        <button type="button" className={btn} title="Copy message" onClick={onCopy}>
          {copied ? <Check size={12} className="text-[var(--color-accent)]" /> : <Copy size={12} />}
        </button>
      </div>
      {metaParts.length > 0 ? (
        <span className="text-[0.7em] tabular-nums text-[var(--color-muted)]">{metaParts.join(' · ')}</span>
      ) : null}
    </div>
  );
}

function AgentTodoPanel({ todos, busy }: { todos: AgentTodoItem[]; busy: boolean }) {
  const [open, setOpen] = useState(true);
  const visible = todos.filter((t) => t.status !== 'cancelled');
  if (!visible.length) return null;

  const done = visible.filter((t) => t.status === 'completed').length;
  const active = visible.filter((t) => t.status === 'pending' || t.status === 'in_progress').length;

  return (
    <div className="border-b border-[var(--color-border)] bg-[var(--color-panel)] px-3 py-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 text-left text-[0.8em] text-[var(--color-muted)] hover:text-[var(--color-fg)]"
      >
        <ListTodo size={13} className="shrink-0 text-[var(--color-accent)]" />
        <span className="flex-1 normal-case">
          Tasks {done}/{visible.length}
          {busy && active > 0 ? ' · working…' : ''}
        </span>
        <ChevronDown size={12} className={open ? 'rotate-180' : ''} />
      </button>
      {open && (
        <ul className="mt-2 max-h-36 space-y-1 overflow-auto text-[0.8em]">
          {visible.map((t) => (
            <li
              key={t.id}
              className={`flex items-start gap-2 rounded px-1 py-0.5 ${
                t.status === 'in_progress' ? 'bg-[var(--color-panel-2)] text-[var(--color-fg)]' : 'text-[var(--color-muted)]'
              } ${t.status === 'completed' ? 'line-through opacity-70' : ''}`}
            >
              <span className="mt-0.5 shrink-0 font-mono text-[0.85em]">
                {t.status === 'completed' ? '✓' : t.status === 'in_progress' ? '◉' : '○'}
              </span>
              <span className="min-w-0 flex-1 normal-case">{t.content}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export const AgentChat = forwardRef<
  AgentChatHandle,
  {
    slug: string | null;
    onFilesChanged: () => void;
    onRequestDeploy: () => void;
    onBusyChange?: (busy: boolean) => void;
  }
>(function AgentChat({ slug, onFilesChanged, onRequestDeploy, onBusyChange }, ref) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessions, setSessions] = useState<SessionMeta[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [threadId, setThreadId] = useState<string | undefined>();
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [sessionMenuOpen, setSessionMenuOpen] = useState(false);
  const [modelId, setModelId] = useState(DEFAULT_IDE_MODEL_ID);
  const [models, setModels] = useState<ModelOption[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [todos, setTodos] = useState<AgentTodoItem[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const paneRef = useRef<HTMLDivElement>(null);
  const agentZoom = usePaneZoom('agent', 14);
  usePaneZoomShortcuts(paneRef, agentZoom);

  const messagesRef = useRef<ChatMessage[]>([]);
  const busyRef = useRef(false);
  const sessionIdRef = useRef<string | null>(null);
  const threadIdRef = useRef<string | undefined>(undefined);
  const modelIdRef = useRef(DEFAULT_IDE_MODEL_ID);
  const todosRef = useRef<AgentTodoItem[]>([]);

  const commitMessages = (next: ChatMessage[]) => {
    messagesRef.current = next;
    setMessages(next);
  };

  const commitTodos = (next: AgentTodoItem[]) => {
    todosRef.current = next;
    setTodos(next);
  };

  const persistSession = useCallback(
    async (id: string, next: ChatMessage[], tid?: string, nextTodos?: AgentTodoItem[]) => {
      if (!slug) return;
      try {
        await fetch(`/api/projects/${slug}/chats/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: next,
            threadId: tid,
            todos: nextTodos ?? todosRef.current,
          }),
        });
        const listRes = await fetch(`/api/projects/${slug}/chats`);
        const listJson = await listRes.json();
        if (listRes.ok) setSessions(listJson.sessions ?? []);
      } catch {
        /* best-effort */
      }
    },
    [slug],
  );

  const loadSession = useCallback(
    async (id: string) => {
      if (!slug) return;
      const res = await fetch(`/api/projects/${slug}/chats/${id}`);
      const data = await res.json();
      if (!res.ok) return;
      const session = data.session as SessionDetail;
      sessionIdRef.current = session.id;
      threadIdRef.current = session.threadId;
      setSessionId(session.id);
      setThreadId(session.threadId);
      commitMessages(session.messages ?? []);
      commitTodos(session.todos ?? []);
    },
    [slug],
  );

  const ensureSession = useCallback(async (): Promise<string | null> => {
    if (!slug) return null;
    if (sessionIdRef.current) return sessionIdRef.current;
    const res = await fetch(`/api/projects/${slug}/chats`, { method: 'POST' });
    const data = await res.json();
    if (!res.ok) return null;
    const session = data.session as SessionDetail;
    sessionIdRef.current = session.id;
    threadIdRef.current = session.threadId;
    setSessionId(session.id);
    setThreadId(session.threadId);
    setSessions((prev) => [
      {
        id: session.id,
        title: session.title,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        messageCount: 0,
      },
      ...prev,
    ]);
    return session.id;
  }, [slug]);

  const startNewChat = useCallback(async () => {
    if (!slug || busyRef.current) return;
    const res = await fetch(`/api/projects/${slug}/chats`, { method: 'POST' });
    const data = await res.json();
    if (!res.ok) return;
    const session = data.session as SessionDetail;
    sessionIdRef.current = session.id;
    threadIdRef.current = session.threadId;
    setSessionId(session.id);
    setThreadId(session.threadId);
    commitMessages([]);
    commitTodos([]);
    const listRes = await fetch(`/api/projects/${slug}/chats`);
    const listJson = await listRes.json();
    if (listRes.ok) setSessions(listJson.sessions ?? []);
    setSessionMenuOpen(false);
  }, [slug]);

  useEffect(() => {
    sessionIdRef.current = null;
    threadIdRef.current = undefined;
    setSessionId(null);
    setThreadId(undefined);
    commitMessages([]);
    commitTodos([]);
    if (!slug) {
      setSessions([]);
      setModels([]);
      return;
    }
    const stored = localStorage.getItem(ideModelStorageKey(slug));
    const nextModel = normalizeIdeModelId(stored);
    modelIdRef.current = nextModel;
    setModelId(nextModel);
    if (stored && stored !== nextModel) {
      localStorage.setItem(ideModelStorageKey(slug), nextModel);
    }
    void fetch(`/api/projects/${slug}/agent/models`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.models)) setModels(data.models);
      })
      .catch(() => {});
    (async () => {
      const res = await fetch(`/api/projects/${slug}/chats`);
      const data = await res.json();
      if (!res.ok) return;
      const list = (data.sessions ?? []) as SessionMeta[];
      setSessions(list);
      if (list.length > 0) await loadSession(list[0].id);
      else await ensureSession();
    })();
  }, [slug, loadSession, ensureSession]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, busy]);

  useEffect(() => {
    onBusyChange?.(busy);
  }, [busy, onBusyChange]);

  const runAgent = async (content: string, design?: DesignContext) => {
    if (!slug || !content.trim() || busyRef.current) return;
    await ensureSession();
    const designNote = design
      ? `Design selection: ${design.selections.length} element${
          design.selections.length > 1 ? 's' : ''
        } on ${design.pagePath}`
      : undefined;
    const modelSpec = resolveIdeModel(modelIdRef.current);
    const userMsg: ChatMessage = {
      role: 'user',
      content: content.trim(),
      designNote,
      createdAt: new Date().toISOString(),
      tokens: estimateTokens(content.trim()),
      contextWindow: modelSpec.contextWindowTokens,
    };
    const withUser = [...messagesRef.current, userMsg];
    commitMessages(withUser);
    busyRef.current = true;
    setBusy(true);
    try {
      const res = await fetch(`/api/projects/${slug}/agent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: withUser.map((m) => ({ role: m.role, content: m.content })),
          designContext: design ?? undefined,
          threadId: threadIdRef.current,
          modelId: modelIdRef.current,
          todos: todosRef.current,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Agent error');
      if (data.threadId) {
        threadIdRef.current = data.threadId;
        setThreadId(data.threadId);
      }
      if (Array.isArray(data.todos)) {
        commitTodos(data.todos);
      }
      const responseModel = resolveIdeModel(
        typeof data.modelId === 'string' ? data.modelId : modelIdRef.current,
      );
      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: data.text || '(no response)',
        tools: data.tools ?? [],
        thoughts: data.thoughts ?? [],
        createdAt: new Date().toISOString(),
        tokens: typeof data.tokens === 'number' && data.tokens > 0 ? data.tokens : undefined,
        contextWindow: responseModel.contextWindowTokens,
      };
      const complete = [...withUser, assistantMsg];
      commitMessages(complete);
      if (sessionIdRef.current) {
        void persistSession(sessionIdRef.current, complete, threadIdRef.current, todosRef.current);
      }
      if (data.filesChanged) onFilesChanged();
      if (data.requestDeploy) onRequestDeploy();
    } catch (err) {
      const errMsg: ChatMessage = { role: 'system', content: `Error: ${(err as Error).message}` };
      const complete = [...withUser, errMsg];
      commitMessages(complete);
      if (sessionIdRef.current) {
        void persistSession(sessionIdRef.current, complete, threadIdRef.current, todosRef.current);
      }
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  const send = async () => {
    if (!input.trim()) return;
    const text = input.trim();
    setInput('');
    await runAgent(text);
  };

  useImperativeHandle(
    ref,
    () => ({
      submitWithDesign: (prompt: string, design: DesignContext) => runAgent(prompt, design),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [slug],
  );

  const activeTitle = sessions.find((s) => s.id === sessionId)?.title ?? 'Chat';
  const activeModel = models.find((m) => m.id === modelId);
  const sessionStats = useMemo(
    () => computeSessionTokenStats(messages, resolveIdeModel(modelId).contextWindowTokens),
    [messages, modelId],
  );

  const onModelChange = (id: string) => {
    modelIdRef.current = id;
    setModelId(id);
    if (slug) localStorage.setItem(ideModelStorageKey(slug), id);
  };

  const setMessageFeedback = (index: number, next: 'up' | 'down' | null) => {
    const updated = messagesRef.current.map((m, i) => {
      if (i !== index) return m;
      if (next === null) {
        const { feedback: _, ...rest } = m;
        return rest;
      }
      return { ...m, feedback: next };
    });
    commitMessages(updated);
    if (sessionIdRef.current) void persistSession(sessionIdRef.current, updated, threadIdRef.current);
  };

  const copyMessage = async (index: number, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedIndex(index);
      window.setTimeout(() => setCopiedIndex((cur) => (cur === index ? null : cur)), 1500);
    } catch {
      /* clipboard blocked */
    }
  };

  const forkFromMessage = async (index: number) => {
    if (!slug || busyRef.current) return;
    const branch = messagesRef.current.slice(0, index + 1);
    const res = await fetch(`/api/projects/${slug}/chats`, { method: 'POST' });
    const data = await res.json();
    if (!res.ok) return;
    const session = data.session as SessionDetail;
    const patchRes = await fetch(`/api/projects/${slug}/chats/${session.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: branch, threadId: session.threadId }),
    });
    if (!patchRes.ok) return;
    sessionIdRef.current = session.id;
    threadIdRef.current = session.threadId;
    setSessionId(session.id);
    setThreadId(session.threadId);
    commitMessages(branch);
    const listRes = await fetch(`/api/projects/${slug}/chats`);
    const listJson = await listRes.json();
    if (listRes.ok) setSessions(listJson.sessions ?? []);
  };

  return (
    <div ref={paneRef} className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-[var(--color-border)] px-3 py-2 text-xs uppercase tracking-wide text-[var(--color-muted)]">
        <span className="flex min-w-0 items-center gap-2">
          <Bot size={14} className="shrink-0 text-[var(--color-accent)]" />
          <div className="relative min-w-0">
            <button
              type="button"
              onClick={() => setSessionMenuOpen((v) => !v)}
              className="flex max-w-[10rem] items-center gap-1 truncate normal-case hover:text-[var(--color-fg)]"
              title={activeTitle}
            >
              <span className="truncate">{activeTitle}</span>
              <ChevronDown size={12} />
            </button>
            {sessionMenuOpen && (
              <div className="absolute left-0 top-full z-20 mt-1 max-h-48 w-56 overflow-auto rounded-md border border-[var(--color-border)] bg-[var(--color-panel)] py-1 shadow-lg">
                {sessions.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setSessionMenuOpen(false);
                      void loadSession(s.id);
                    }}
                    className={`block w-full truncate px-3 py-1.5 text-left text-xs normal-case hover:bg-[var(--color-panel-2)] ${
                      s.id === sessionId ? 'text-[var(--color-accent)]' : 'text-[var(--color-fg)]'
                    }`}
                  >
                    {s.title}
                  </button>
                ))}
              </div>
            )}
          </div>
        </span>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => void startNewChat()}
            disabled={!slug || busy}
            title="New chat"
            className="rounded p-1 hover:bg-[var(--color-panel-2)] hover:text-[var(--color-fg)] disabled:opacity-40"
          >
            <MessageSquarePlus size={14} />
          </button>
          <PaneZoomControls
            value={agentZoom.size}
            defaultValue={agentZoom.defaultSize}
            min={agentZoom.min}
            max={agentZoom.max}
            onZoomIn={agentZoom.zoomIn}
            onZoomOut={agentZoom.zoomOut}
            onReset={agentZoom.reset}
            title="Agent chat font size"
          />
        </div>
      </div>
      <AgentTodoPanel todos={todos} busy={busy} />
      <div
        ref={scrollRef}
        className="min-h-0 flex-1 space-y-3 overflow-auto p-3"
        style={{ fontSize: `${agentZoom.size}px` }}
      >
        {messages.length === 0 && (
          <p className="text-[0.85em] text-[var(--color-muted)]">
            Ask the agent to edit files in <strong>{slug ?? 'this project'}</strong>. It uses{' '}
            <code className="text-[0.9em]">patch_file</code> for surgical edits and saves chat
            history per session.
          </p>
        )}
        {(() => {
          let contextUsed = 0;
          return messages.map((m, i) => {
            contextUsed += m.tokens ?? 0;
            return (
          <div key={i} className={`group ${m.role === 'user' ? 'text-right' : ''}`}>
            <div
              className={`inline-block max-w-[92%] whitespace-pre-wrap rounded-lg px-3 py-2 text-left ${
                m.role === 'user'
                  ? 'bg-[var(--color-accent-soft)] text-[var(--color-fg)]'
                  : m.role === 'system'
                    ? 'bg-transparent text-[var(--color-danger)]'
                    : 'bg-[var(--color-panel-2)] text-[var(--color-fg)]'
              }`}
            >
              {m.content}
              {m.thoughts && m.thoughts.length > 0 && <ThoughtTrace thoughts={m.thoughts} />}
              {m.tools && m.tools.length > 0 && (
                <div className="mt-2 space-y-1 border-t border-[var(--color-border)] pt-2">
                  {m.tools.map((t, j) => (
                    <div key={j} className="flex items-center gap-1 text-[0.85em] text-[var(--color-muted)]">
                      <Wrench size={11} /> <span className="font-mono">{t.tool}</span> — {t.summary}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {m.designNote && (
              <div className="mt-1 flex items-center justify-end gap-1 text-[0.75em] text-[var(--color-muted)]">
                <MousePointerClick size={10} /> {m.designNote}
              </div>
            )}
            {m.role !== 'system' && m.content.trim() ? (
              <MessageActions
                align={m.role === 'user' ? 'right' : 'left'}
                feedback={m.feedback}
                copied={copiedIndex === i}
                onCopy={() => void copyMessage(i, m.content)}
                onLike={() => setMessageFeedback(i, m.feedback === 'up' ? null : 'up')}
                onDislike={() => setMessageFeedback(i, m.feedback === 'down' ? null : 'down')}
                onFork={() => void forkFromMessage(i)}
                createdAt={m.createdAt}
                tokens={m.tokens}
                contextUsed={contextUsed > 0 ? contextUsed : undefined}
                contextWindow={m.contextWindow}
              />
            ) : null}
          </div>
            );
          });
        })()}
        {busy && (
          <div className="flex items-center gap-2 text-[0.85em] text-[var(--color-muted)]">
            <Loader2 size={13} className="animate-spin" /> thinking…
          </div>
        )}
      </div>
      <div className="border-t border-[var(--color-border)] p-2" style={{ fontSize: `${agentZoom.size}px` }}>
        {sessionStats.totalTokens > 0 || messages.length > 0 ? (
          <div className="mb-2 flex justify-end px-0.5">
            <span className="text-[0.7em] tabular-nums text-[var(--color-muted)]">
              Session: {formatTokenCount(sessionStats.totalTokens)} tok
              {sessionStats.contextWindow
                ? ` · ${formatTokenCount(sessionStats.contextUsed)}/${formatTokenCount(sessionStats.contextWindow)} ctx`
                : ''}
            </span>
          </div>
        ) : null}
        <div className="mb-2 flex items-center gap-2">
          <label htmlFor="ide-model" className="shrink-0 text-[0.75em] text-[var(--color-muted)]">
            Model
          </label>
          <select
            id="ide-model"
            value={modelId}
            onChange={(e) => onModelChange(e.target.value)}
            disabled={!slug || busy}
            title={activeModel?.description}
            className="min-w-0 flex-1 truncate rounded-md border border-[var(--color-border)] bg-[var(--color-panel-2)] px-2 py-1 text-[0.85em] outline-none focus:border-[var(--color-accent)] disabled:opacity-50"
          >
            {(models.length ? models : [resolveIdeModel(modelId) as ModelOption]).map(
              (m) => (
                <option key={m.id} value={m.id} disabled={m.configured === false}>
                  {m.label}
                  {m.configured === false ? ' (no API key)' : ''}
                </option>
              ),
            )}
          </select>
        </div>
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder={slug ? 'Edit this project…' : 'Select a project'}
            disabled={!slug || busy}
            rows={2}
            className="min-h-0 flex-1 resize-none rounded-md border border-[var(--color-border)] bg-[var(--color-panel-2)] px-2 py-1.5 outline-none focus:border-[var(--color-accent)] disabled:opacity-50"
          />
          <button
            onClick={send}
            disabled={!slug || busy || !input.trim()}
            className="flex h-9 w-9 items-center justify-center rounded-md bg-[var(--color-accent)] text-[var(--color-accent-fg)] hover:opacity-90 disabled:opacity-40"
          >
            <Send size={15} />
          </button>
        </div>
      </div>
    </div>
  );
});
