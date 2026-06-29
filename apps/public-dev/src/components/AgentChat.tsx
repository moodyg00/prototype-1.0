'use client';

import { useEffect, useRef, useState } from 'react';
import { Bot, Loader2, Send, Wrench } from 'lucide-react';
import { PaneZoomControls } from './PaneZoomControls';
import { usePaneZoom, usePaneZoomShortcuts } from '@/src/lib/usePaneZoom';

type ToolEvent = { tool: string; summary: string };

type ChatMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
  tools?: ToolEvent[];
};

export function AgentChat({
  slug,
  onFilesChanged,
  onRequestDeploy,
}: {
  slug: string | null;
  onFilesChanged: () => void;
  onRequestDeploy: () => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const paneRef = useRef<HTMLDivElement>(null);
  const agentZoom = usePaneZoom('agent', 14);
  usePaneZoomShortcuts(paneRef, agentZoom);

  useEffect(() => {
    setMessages([]);
  }, [slug]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, busy]);

  const send = async () => {
    if (!slug || !input.trim() || busy) return;
    const userMsg: ChatMessage = { role: 'user', content: input.trim() };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput('');
    setBusy(true);
    try {
      const res = await fetch(`/api/projects/${slug}/agent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: history.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Agent error');
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.text || '(no response)', tools: data.tools ?? [] },
      ]);
      if (data.filesChanged) onFilesChanged();
      if (data.requestDeploy) onRequestDeploy();
    } catch (err) {
      setMessages((prev) => [...prev, { role: 'system', content: `Error: ${(err as Error).message}` }]);
    } finally {
      setBusy(false);
    }
  };

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
}
