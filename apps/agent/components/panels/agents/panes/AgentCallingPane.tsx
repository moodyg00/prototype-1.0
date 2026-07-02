'use client';

import type { PaneRenderContext } from '@/lib/pane-types';
import { useAgents } from '../AgentsProvider';
import { AgentsPaneShell } from '../agents-pane-utils';

export function AgentCallingPane({ context: _context }: { context: PaneRenderContext }) {
  const { phoneConfig } = useAgents();

  const webhookBase =
    typeof window !== 'undefined'
      ? `${window.location.origin}/api/twilio`
      : '/api/twilio';

  return (
    <AgentsPaneShell title="Voice / Calling">
      <div className="flex flex-col gap-3 text-[12px] text-zinc-400">
        {/* Status */}
        <div className="flex items-center gap-2 rounded border border-zinc-700/60 bg-zinc-900 px-2.5 py-2 text-[11px]">
          <span
            className={`h-2 w-2 rounded-full flex-shrink-0 ${phoneConfig?.isConfigured ? 'bg-yellow-500' : 'bg-zinc-600'}`}
          />
          <span className="text-zinc-400">
            {phoneConfig?.isConfigured
              ? `Phone configured — inbound calls redirect to SMS`
              : 'Not configured — set up phone in the Phone pane first'}
          </span>
        </div>

        <p className="text-zinc-500 text-[11px]">
          When someone calls the agent's Twilio number, they hear a message directing them to text
          instead. Full browser-based calling (WebRTC) can be enabled once you add a Twilio Voice
          application.
        </p>

        {/* Voice webhook */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 mb-1.5">
            Voice webhook URL
          </p>
          <p className="text-[11px] text-zinc-500 mb-1.5">
            Set this as the <strong className="text-zinc-400">A call comes in</strong> webhook in
            your{' '}
            <a
              href="https://console.twilio.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-400 underline underline-offset-2"
            >
              Twilio console
            </a>{' '}
            for the assigned phone number.
          </p>
          <div className="flex items-center gap-1.5 rounded border border-zinc-700/60 bg-zinc-900 px-2 py-1">
            <code className="flex-1 truncate font-mono text-[11px] text-zinc-300">
              {webhookBase}/voice
            </code>
          </div>
        </div>

        {/* Future plans */}
        <div className="mt-1 rounded border border-zinc-800 bg-zinc-900/50 px-3 py-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 mb-1">
            Roadmap
          </p>
          <ul className="flex flex-col gap-1 text-[11px] text-zinc-600 list-disc list-inside">
            <li>Browser-based outbound calling (WebRTC)</li>
            <li>Inbound call queuing &amp; routing</li>
            <li>Call recording &amp; transcription to agent memory</li>
            <li>Voicemail-to-text inbox</li>
          </ul>
        </div>
      </div>
    </AgentsPaneShell>
  );
}
