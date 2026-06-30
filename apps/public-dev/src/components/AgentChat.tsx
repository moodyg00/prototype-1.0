'use client';

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Bot, Loader2, MousePointerClick, Send, Wrench } from 'lucide-react';
import { PaneZoomControls } from './PaneZoomControls';
import { usePaneZoom, usePaneZoomShortcuts } from '@/src/lib/usePaneZoom';
import type { DesignContext } from '@/src/lib/design-mode';

type ToolEvent = { tool: string; summary: string };

type ChatMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
  tools?: ToolEvent[];
  /** Short note shown under a user message when Design Mode context was attached. */
  designNote?: string;
};

export type AgentChatHandle = {
  /**
   * Submit a prompt with attached Design Mode context (from the preview overlay).
   * Resolves when the agent run completes, so the overlay can sequence a queue.
   */
  submitWithDesign: (prompt: string, design: DesignContext) => Promise<void>;
};

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
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const paneRef = useRef<HTMLDivElement>(null);
  const agentZoom = usePaneZoom('agent', 14);
  usePaneZoomShortcuts(paneRef, agentZoom);

  // Refs mirror state so sequential awaited runs (the Design Mode queue) always
  // see the latest history/busy without waiting for a React re-render.
  const messagesRef = useRef<ChatMessage[]>([]);
  const busyRef = useRef(false);

  const commitMessages = (next: ChatMessage[]) => {
    messagesRef.current = next;
    setMessages(next);
  };

  useEffect(() => {
    commitMessages([]);
  }, [slug]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, busy]);

  useEffect(() => {
    onBusyChange?.(busy);
  }, [busy, onBusyChange]);

  const runAgent = async (content: string, design?: DesignContext) => {
    if (!slug || !content.trim() || busyRef.current) return;
    const designNote = design
      ? `Design selection: ${design.selections.length} element${
          design.selections.length > 1 ? 's' : ''
        } on ${design.pagePath}`
      : undefined;
    const userMsg: ChatMessage = { role: 'user', content: content.trim(), designNote };
    commitMessages([...messagesRef.current, userMsg]);
    busyRef.current = true;
    setBusy(true);
    try {
      const res = await fetch(`/api/projects/${slug}/agent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messagesRef.current.map((m) => ({ role: m.role, content: m.content })),
          designContext: design ?? undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Agent error');
      commitMessages([
        ...messagesRef.current,
        { role: 'assistant', content: data.text || '(no response)', tools: data.tools ?? [] },
      ]);
      if (data.filesChanged) onFilesChanged();
      if (data.requestDeploy) onRequestDeploy();
    } catch (err) {
      commitMessages([...messagesRef.current, { role: 'system', content: `Error: ${(err as Error).message}` }]);
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
    // runAgent reads history/busy from refs; only slug affects the request.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [slug],
  );

  return (
    <div ref={paneRef} className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-[var(--color-border)] px-3 py-2 text-xs uppercase tracking-wide text-[var(--color-muted)]">
        <span className="flex items-center gap-2">
          <Bot size={14} className="text-[var(--color-accent)]" /> Agent
        </span>
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
      <div
        ref={scrollRef}
        className="min-h-0 flex-1 space-y-3 overflow-auto p-3"
        style={{ fontSize: `${agentZoom.size}px` }}
      >
        {messages.length === 0 && (
          <p className="text-[0.85em] text-[var(--color-muted)]">
            Ask the agent to edit files in <strong>{slug ?? 'this project'}</strong>. It can read,
            write, and delete files scoped to this project only. It will never deploy without your
            confirmation.
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
