'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import type { PaneRenderContext } from '@/lib/pane-types';
import type { SmsMessage, SmsThread } from '@/lib/agents/phone-types';
import { useAgents } from '../AgentsProvider';
import { AgentsPaneShell } from '../agents-pane-utils';

export function AgentTextingPane({ context: _context }: { context: PaneRenderContext }) {
  const { selectedAgentId, phoneConfig } = useAgents();

  const [threads, setThreads] = useState<SmsThread[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<SmsMessage[]>([]);
  const [compose, setCompose] = useState('');
  const [newContact, setNewContact] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingThreads, setLoadingThreads] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadThreads = useCallback(async () => {
    if (!selectedAgentId) return;
    setLoadingThreads(true);
    try {
      const res = await fetch(
        `/api/agents/${encodeURIComponent(selectedAgentId)}/sms/threads`,
      );
      const data = (await res.json()) as { threads?: SmsThread[]; error?: string };
      if (res.ok) setThreads(data.threads ?? []);
    } catch {
      // ignore
    } finally {
      setLoadingThreads(false);
    }
  }, [selectedAgentId]);

  const loadMessages = useCallback(async (threadId: string) => {
    if (!selectedAgentId) return;
    setLoadingMessages(true);
    try {
      const res = await fetch(
        `/api/agents/${encodeURIComponent(selectedAgentId)}/sms/threads/${encodeURIComponent(threadId)}`,
      );
      const data = (await res.json()) as { messages?: SmsMessage[]; error?: string };
      if (res.ok) setMessages(data.messages ?? []);
    } catch {
      // ignore
    } finally {
      setLoadingMessages(false);
    }
  }, [selectedAgentId]);

  useEffect(() => {
    void loadThreads();
  }, [loadThreads]);

  useEffect(() => {
    if (selectedThreadId) {
      void loadMessages(selectedThreadId);
    } else {
      setMessages([]);
    }
  }, [selectedThreadId, loadMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const activeThread = threads.find((t) => t.id === selectedThreadId);

  const handleSend = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const text = compose.trim();
      const to = activeThread?.contactPhone ?? newContact.trim();
      if (!text || !to || !selectedAgentId) return;
      setSending(true);
      try {
        const res = await fetch(
          `/api/agents/${encodeURIComponent(selectedAgentId)}/sms/send`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ to, message: text }),
          },
        );
        const data = (await res.json()) as { ok?: boolean; threadId?: string; error?: string };
        if (!res.ok) throw new Error(data.error ?? 'Send failed');
        setCompose('');
        setNewContact('');
        if (data.threadId) {
          setSelectedThreadId(data.threadId);
          await loadMessages(data.threadId);
        }
        await loadThreads();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Send failed');
      } finally {
        setSending(false);
      }
    },
    [compose, activeThread, newContact, selectedAgentId, loadMessages, loadThreads],
  );

  if (!phoneConfig?.isConfigured) {
    return (
      <AgentsPaneShell title="Texting">
        <p className="text-[12px] text-zinc-500">
          Configure a Twilio phone number in the <strong className="text-zinc-400">Phone</strong> pane to enable texting.
        </p>
      </AgentsPaneShell>
    );
  }

  return (
    <div className="flex h-full min-h-0 overflow-hidden text-zinc-200">
      {/* Thread list */}
      <div className="flex w-44 flex-shrink-0 flex-col border-r border-zinc-800">
        <div className="flex items-center justify-between px-2.5 py-2 border-b border-zinc-800">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
            Threads
          </span>
          <button
            type="button"
            onClick={() => setSelectedThreadId(null)}
            className="text-[10px] text-zinc-500 hover:text-zinc-300"
            title="New message"
          >
            + New
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loadingThreads && (
            <p className="px-2.5 py-2 text-[11px] text-zinc-600">Loading…</p>
          )}
          {!loadingThreads && threads.length === 0 && (
            <p className="px-2.5 py-2 text-[11px] text-zinc-600">No threads yet</p>
          )}
          {threads.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSelectedThreadId(t.id)}
              className={`w-full px-2.5 py-2 text-left hover:bg-zinc-800/60 transition-colors ${
                selectedThreadId === t.id ? 'bg-zinc-800' : ''
              }`}
            >
              <div className="text-[12px] font-medium text-zinc-300 truncate">
                {t.contactPhone}
              </div>
              {t.lastMessageAt && (
                <div className="text-[10px] text-zinc-600">
                  {new Date(t.lastMessageAt).toLocaleDateString()}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Message view + compose */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center gap-2 border-b border-zinc-800 px-3 py-2">
          {activeThread ? (
            <span className="text-[12px] font-medium text-zinc-300">
              {activeThread.contactPhone}
            </span>
          ) : (
            <span className="text-[12px] text-zinc-500">New message</span>
          )}
          {activeThread && (
            <button
              type="button"
              onClick={() => void loadMessages(activeThread.id)}
              className="ml-auto text-[10px] text-zinc-600 hover:text-zinc-400"
            >
              refresh
            </button>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-3 py-2 flex flex-col gap-2">
          {loadingMessages && (
            <p className="text-[11px] text-zinc-600">Loading…</p>
          )}
          {!selectedThreadId && !activeThread && (
            <p className="text-[11px] text-zinc-600">Select a thread or start a new conversation.</p>
          )}
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[75%] rounded-lg px-3 py-1.5 text-[12px] ${
                  m.direction === 'outbound'
                    ? 'bg-zinc-700 text-zinc-100'
                    : 'bg-zinc-800 text-zinc-200'
                }`}
              >
                <p>{m.body}</p>
                <p className={`mt-0.5 text-[10px] ${m.direction === 'outbound' ? 'text-zinc-400' : 'text-zinc-500'}`}>
                  {m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Compose */}
        <form onSubmit={handleSend} className="border-t border-zinc-800 p-2 flex flex-col gap-1.5">
          {!activeThread && (
            <input
              className="rounded border border-zinc-700 bg-zinc-800/60 px-2 py-1 text-[12px] text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-500"
              placeholder="Phone number to text…"
              value={newContact}
              onChange={(e) => setNewContact(e.target.value)}
            />
          )}
          <div className="flex gap-1.5">
            <input
              className="flex-1 rounded border border-zinc-700 bg-zinc-800/60 px-2 py-1 text-[12px] text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-500"
              placeholder="Type a message…"
              value={compose}
              onChange={(e) => setCompose(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  const syntheticEvent = { preventDefault: () => undefined } as React.FormEvent;
                  void handleSend(syntheticEvent);
                }
              }}
            />
            <button
              type="submit"
              disabled={sending || (!compose.trim()) || (!activeThread && !newContact.trim())}
              className="rounded bg-zinc-700 px-3 py-1 text-[12px] font-medium text-zinc-200 hover:bg-zinc-600 disabled:opacity-40"
            >
              {sending ? '…' : 'Send'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
