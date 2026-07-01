'use client';

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import {
  Bot,
  ChevronDown,
  Loader2,
  MessageSquarePlus,
  MousePointerClick,
  Send,
  Sparkles,
  Wrench,
} from 'lucide-react';
import { PaneZoomControls } from './PaneZoomControls';
import { usePaneZoom, usePaneZoomShortcuts } from '@/src/lib/usePaneZoom';
import type { DesignContext } from '@/src/lib/design-mode';

type ToolEvent = { tool: string; summary: string };
type ThoughtStep = { step: number; reasoning?: string; tool?: string; summary?: string };

type ChatMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
  tools?: ToolEvent[];
  thoughts?: ThoughtStep[];
  designNote?: string;
};

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
};

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
  const scrollRef = useRef<HTMLDivElement>(null);
  const paneRef = useRef<HTMLDivElement>(null);
  const agentZoom = usePaneZoom('agent', 14);
  usePaneZoomShortcuts(paneRef, agentZoom);

  const messagesRef = useRef<ChatMessage[]>([]);
  const busyRef = useRef(false);
  const sessionIdRef = useRef<string | null>(null);
  const threadIdRef = useRef<string | undefined>(undefined);

  const commitMessages = (next: ChatMessage[]) => {
    messagesRef.current = next;
    setMessages(next);
  };

  const persistSession = useCallback(
    async (id: string, next: ChatMessage[], tid?: string) => {
      if (!slug) return;
      try {
        await fetch(`/api/projects/${slug}/chats/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: next, threadId: tid }),
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
    if (!slug) {
      setSessions([]);
      return;
    }
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
    const userMsg: ChatMessage = { role: 'user', content: content.trim(), designNote };
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
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Agent error');
      if (data.threadId) {
        threadIdRef.current = data.threadId;
        setThreadId(data.threadId);
      }
      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: data.text || '(no response)',
        tools: data.tools ?? [],
        thoughts: data.thoughts ?? [],
      };
      const complete = [...withUser, assistantMsg];
      commitMessages(complete);
      if (sessionIdRef.current) void persistSession(sessionIdRef.current, complete, threadIdRef.current);
      if (data.filesChanged) onFilesChanged();
      if (data.requestDeploy) onRequestDeploy();
    } catch (err) {
      const errMsg: ChatMessage = { role: 'system', content: `Error: ${(err as Error).message}` };
      const complete = [...withUser, errMsg];
      commitMessages(complete);
      if (sessionIdRef.current) void persistSession(sessionIdRef.current, complete, threadIdRef.current);
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
        {messages.map((m, i) => (
          <div key={i} className={m.role === 'user' ? 'text-right' : ''}>
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
          </div>
        ))}
        {busy && (
          <div className="flex items-center gap-2 text-[0.85em] text-[var(--color-muted)]">
            <Loader2 size={13} className="animate-spin" /> thinking…
          </div>
        )}
      </div>
      <div className="border-t border-[var(--color-border)] p-2" style={{ fontSize: `${agentZoom.size}px` }}>
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
