'use client';

import { useRef, useState } from 'react';
import { Loader2, MessageSquarePlus, Send, ThumbsUp } from 'lucide-react';
import { toast } from 'sonner';

import type { PaneRenderContext } from '@/lib/pane-types';
import { useAgents } from '../AgentsProvider';
import { AgentsPaneShell } from '../agents-pane-utils';

export function AgentChatPane({ context: _context }: { context: PaneRenderContext }) {
  const {
    selectedAgent,
    chatMessages,
    chatBusy,
    chatModelId,
    setChatModelId,
    models,
    clearChat,
    sendChat,
    addTrainingFromChatTurn,
  } = useAgents();
  const [draft, setDraft] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  async function handleSend() {
    const text = draft.trim();
    if (!text || chatBusy) return;
    setDraft('');
    await sendChat(text);
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <AgentsPaneShell>
      <div className="flex min-h-0 flex-1 flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-medium text-zinc-300">
            {selectedAgent ? selectedAgent.name : 'No agent'}
          </span>
          <select
            className="ml-auto max-w-[180px] rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-[10px] text-zinc-300"
            value={chatModelId}
            onChange={(e) => setChatModelId(e.target.value)}
          >
            {models.map((m) => (
              <option key={m.id} value={m.id} disabled={m.configured === false}>
                {m.label}
                {m.configured === false ? ' (no key)' : ''}
              </option>
            ))}
          </select>
          <button
            type="button"
            title="Clear thread"
            className="rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
            onClick={() => clearChat()}
          >
            <MessageSquarePlus size={14} />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-2 overflow-auto rounded border border-zinc-800 bg-zinc-950/50 p-2">
          {chatMessages.length === 0 ? (
            <p className="text-[11px] text-zinc-500">
              Send a message to test persona and memory recall for this agent.
            </p>
          ) : null}
          {chatMessages.map((m, i) => (
            <div
              key={`${i}-${m.role}`}
              className={`group max-w-[95%] rounded px-2.5 py-1.5 text-[11px] leading-relaxed ${
                m.role === 'user'
                  ? 'ml-auto bg-violet-900/40 text-violet-100'
                  : 'bg-zinc-800/80 text-zinc-200'
              }`}
            >
              <div className="whitespace-pre-wrap">{m.content}</div>
              {m.role === 'assistant' ? (
                <button
                  type="button"
                  title="Add to training examples"
                  className="mt-1 flex items-center gap-1 text-[10px] text-zinc-500 opacity-0 transition-opacity group-hover:opacity-100 hover:text-violet-400"
                  onClick={() =>
                    void addTrainingFromChatTurn(i).then(() =>
                      toast.success('Saved to training'),
                    )
                  }
                >
                  <ThumbsUp size={11} />
                  Train
                </button>
              ) : null}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void handleSend();
          }}
        >
          <input
            className="min-w-0 flex-1 rounded border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-[11px] text-zinc-100 placeholder:text-zinc-600"
            placeholder={selectedAgent ? 'Message…' : 'Select an agent first'}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            disabled={!selectedAgent || chatBusy}
          />
          <button
            type="submit"
            disabled={!selectedAgent || chatBusy || !draft.trim()}
            className="flex items-center gap-1 rounded bg-zinc-100 px-3 py-1.5 text-[11px] font-medium text-zinc-900 disabled:opacity-40"
          >
            {chatBusy ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
            Send
          </button>
        </form>
      </div>
    </AgentsPaneShell>
  );
}