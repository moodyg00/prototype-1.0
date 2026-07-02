'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import type { PaneRenderContext } from '@/lib/pane-types';
import { useAgents } from '../AgentsProvider';
import { AgentsPaneShell } from '../agents-pane-utils';

function labelClass() {
  return 'flex flex-col gap-1 text-[11px]';
}

function inputClass() {
  return 'rounded border border-zinc-700 bg-zinc-800/60 px-2 py-1.5 text-zinc-200 placeholder-zinc-600 text-[12px] focus:outline-none focus:ring-1 focus:ring-zinc-500';
}

export function AgentPhonePane({ context: _context }: { context: PaneRenderContext }) {
  const { selectedAgentId, phoneConfig, refreshPhoneConfig } = useAgents();

  const [accountSid, setAccountSid] = useState('');
  const [authToken, setAuthToken] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [saving, setSaving] = useState(false);

  // Pre-fill phone number from existing config
  useEffect(() => {
    if (phoneConfig?.twilioPhoneNumber) {
      setPhoneNumber(phoneConfig.twilioPhoneNumber);
    }
  }, [phoneConfig?.twilioPhoneNumber]);

  const webhookBase =
    typeof window !== 'undefined'
      ? `${window.location.origin}/api/twilio`
      : '/api/twilio';

  const handleSave = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedAgentId) return;
      setSaving(true);
      try {
        const body: Record<string, string> = {};
        if (accountSid.trim()) body.accountSid = accountSid.trim();
        if (authToken.trim()) body.authToken = authToken.trim();
        if (phoneNumber.trim()) body.phoneNumber = phoneNumber.trim();

        const res = await fetch(`/api/agents/${encodeURIComponent(selectedAgentId)}/phone`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const data = (await res.json()) as { ok?: boolean; error?: string };
        if (!res.ok) throw new Error(data.error ?? 'Save failed');
        await refreshPhoneConfig();
        setAccountSid('');
        setAuthToken('');
        toast.success('Phone configuration saved');
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Save failed');
      } finally {
        setSaving(false);
      }
    },
    [selectedAgentId, accountSid, authToken, phoneNumber, refreshPhoneConfig],
  );

  return (
    <AgentsPaneShell title="Phone / Twilio">
      {/* Status strip */}
      <div className="flex items-center gap-2 rounded border border-zinc-700/60 bg-zinc-900 px-2.5 py-2 text-[11px]">
        <span
          className={`h-2 w-2 rounded-full flex-shrink-0 ${phoneConfig?.isConfigured ? 'bg-green-500' : 'bg-zinc-600'}`}
        />
        <span className="text-zinc-400">
          {phoneConfig?.isConfigured
            ? `Configured — ${phoneConfig.twilioPhoneNumber}`
            : 'Not configured'}
        </span>
        {phoneConfig?.twilioAccountSid && (
          <span className="ml-auto font-mono text-zinc-600">{phoneConfig.twilioAccountSid}</span>
        )}
      </div>

      <form onSubmit={handleSave} className="flex flex-col gap-3 mt-1">
        {/* Twilio credentials */}
        <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
          Twilio credentials
        </p>
        <label className={labelClass()}>
          <span className="text-zinc-400">Account SID</span>
          <input
            className={inputClass()}
            placeholder={phoneConfig?.twilioAccountSid ?? 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'}
            value={accountSid}
            onChange={(e) => setAccountSid(e.target.value)}
          />
        </label>
        <label className={labelClass()}>
          <span className="text-zinc-400">Auth Token {phoneConfig?.twilioAuthTokenConfigured ? '(already set)' : ''}</span>
          <input
            type="password"
            className={inputClass()}
            placeholder={phoneConfig?.twilioAuthTokenConfigured ? '••••••••••••••••' : 'Enter auth token'}
            value={authToken}
            onChange={(e) => setAuthToken(e.target.value)}
            autoComplete="off"
          />
        </label>

        {/* Phone number assignment */}
        <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 mt-1">
          Phone number
        </p>
        <label className={labelClass()}>
          <span className="text-zinc-400">Twilio phone number for this agent</span>
          <input
            className={inputClass()}
            placeholder="+15551234567"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
          />
        </label>

        <button
          type="submit"
          disabled={saving}
          className="mt-1 rounded bg-zinc-700 px-3 py-1.5 text-[12px] font-medium text-zinc-200 hover:bg-zinc-600 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save configuration'}
        </button>
      </form>

      {/* Webhook URLs */}
      <div className="mt-3 flex flex-col gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
          Twilio webhook URLs
        </p>
        <p className="text-[11px] text-zinc-500">
          Set these in your{' '}
          <a
            href="https://console.twilio.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-400 underline underline-offset-2"
          >
            Twilio console
          </a>{' '}
          for the phone number above.
        </p>
        {[
          { label: 'SMS webhook', url: `${webhookBase}/sms` },
          { label: 'Voice webhook', url: `${webhookBase}/voice` },
        ].map(({ label, url }) => (
          <div key={label} className="flex flex-col gap-0.5">
            <span className="text-[10px] text-zinc-500">{label}</span>
            <div className="flex items-center gap-1.5 rounded border border-zinc-700/60 bg-zinc-900 px-2 py-1">
              <code className="flex-1 truncate font-mono text-[11px] text-zinc-300">{url}</code>
              <button
                type="button"
                onClick={() => {
                  void navigator.clipboard.writeText(url);
                  toast.success('Copied');
                }}
                className="flex-shrink-0 text-[10px] text-zinc-500 hover:text-zinc-300"
              >
                copy
              </button>
            </div>
          </div>
        ))}
      </div>
    </AgentsPaneShell>
  );
}
