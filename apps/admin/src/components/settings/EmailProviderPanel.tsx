'use client';

/**
 * EmailProviderPanel — settings UI for the email provider integration.
 *
 * Reads/writes the single `settings` row (module="email", key="provider") via
 * /api/admin/settings/email. Secrets (SMTP password, API key) are masked: the
 * API returns "********" when a secret is stored, and re-sending that mask
 * preserves the existing secret on save.
 */

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import type { EmailProviderConfig, EmailProviderId } from '@/src/lib/email/provider';

const PROVIDER_OPTIONS: { value: EmailProviderId; label: string }[] = [
  { value: 'none', label: 'None (logging no-op)' },
  { value: 'smtp', label: 'SMTP' },
  { value: 'resend', label: 'Resend' },
  { value: 'sendgrid', label: 'SendGrid' },
  { value: 'postmark', label: 'Postmark' },
];

const API_KEY_PROVIDERS: EmailProviderId[] = ['resend', 'sendgrid', 'postmark'];

/** Placeholders shown when SMTP is selected (Gmail / Google Workspace). */
const GMAIL_SMTP_HINTS = {
  fromName: 'Your Business',
  fromEmail: 'you@yourdomain.com',
  replyTo: 'support@yourdomain.com',
  host: 'smtp.gmail.com',
  port: '587',
  username: 'you@yourdomain.com',
  password: 'Google App Password (16 chars)',
} as const;

const EMPTY_CONFIG: EmailProviderConfig = {
  provider: 'none',
  fromName: '',
  fromEmail: '',
  replyTo: '',
  credentials: {},
};

export function EmailProviderPanel(): React.ReactElement {
  const [config, setConfig] = useState<EmailProviderConfig>(EMPTY_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testTo, setTestTo] = useState('');
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const res = await fetch('/api/admin/settings/email', { cache: 'no-store' });
        const body = (await res.json().catch(() => ({}))) as { config?: EmailProviderConfig };
        if (active && body.config) setConfig({ ...EMPTY_CONFIG, ...body.config });
      } catch {
        if (active) toast.error('Could not load email settings.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const update = (patch: Partial<EmailProviderConfig>) => setConfig((prev) => ({ ...prev, ...patch }));
  const updateCredential = (patch: Partial<EmailProviderConfig['credentials']>) =>
    setConfig((prev) => ({ ...prev, credentials: { ...prev.credentials, ...patch } }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings/email', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      const body = (await res.json().catch(() => ({}))) as {
        config?: EmailProviderConfig;
        error?: string;
      };
      if (!res.ok) throw new Error(body.error ?? 'Save failed.');
      if (body.config) setConfig({ ...EMPTY_CONFIG, ...body.config });
      toast.success('Email provider settings saved.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const handleTestSend = async () => {
    const to = testTo.trim();
    if (!to) {
      toast.error('Enter a recipient email for the test.');
      return;
    }
    setTesting(true);
    try {
      const res = await fetch('/api/admin/settings/email/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        delivered?: boolean;
        detail?: string;
        error?: string;
      };
      if (!res.ok) throw new Error(body.error ?? 'Test send failed.');
      if (body.delivered) toast.success(body.detail ?? 'Test email delivered.');
      else toast.warning(body.detail ?? 'Test send completed without delivery.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Test send failed.');
    } finally {
      setTesting(false);
    }
  };

  const isSmtp = config.provider === 'smtp';
  const isApiKey = API_KEY_PROVIDERS.includes(config.provider);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h3 className="text-base font-semibold">Email Provider</h3>
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
          Configure outbound mail for booking pages, manual sends on <code>/admin/mail</code>, and
          other app emails. Stored in <code>settings</code> under module{' '}
          <Badge variant="outline">email</Badge> (not API integrations — this is your website mail
          server or transactional provider).
        </p>
      </div>

      <section className="space-y-4" aria-busy={loading}>
        <Field>
          <FieldLabel>Provider</FieldLabel>
          <Select
            value={config.provider}
            onValueChange={(value) => update({ provider: value as EmailProviderId })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectPopup>
              {PROVIDER_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectPopup>
          </Select>
          <FieldDescription>
            When no provider is configured, sends resolve as a logged no-op (nothing is delivered).
          </FieldDescription>
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel>From name</FieldLabel>
            <Input
              value={config.fromName}
              onChange={(event) => update({ fromName: event.target.value })}
              placeholder={isSmtp ? GMAIL_SMTP_HINTS.fromName : 'Acme Notifications'}
            />
          </Field>
          <Field>
            <FieldLabel>From email</FieldLabel>
            <Input
              type="email"
              value={config.fromEmail}
              onChange={(event) => update({ fromEmail: event.target.value })}
              placeholder={isSmtp ? GMAIL_SMTP_HINTS.fromEmail : 'no-reply@acme.com'}
            />
            {isSmtp ? (
              <FieldDescription>Must match your Workspace mailbox (or an allowed send-as alias).</FieldDescription>
            ) : null}
          </Field>
        </div>

        <Field>
          <FieldLabel>Reply-to</FieldLabel>
          <Input
            type="email"
            value={config.replyTo}
            onChange={(event) => update({ replyTo: event.target.value })}
            placeholder={isSmtp ? GMAIL_SMTP_HINTS.replyTo : 'support@acme.com'}
          />
        </Field>

        {isSmtp ? (
          <div className="space-y-4 rounded-lg border p-4" style={{ borderColor: 'var(--border)' }}>
            <div className="space-y-1">
              <div className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--muted-foreground)' }}>
                SMTP credentials
              </div>
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                Google Workspace: host <code>smtp.gmail.com</code>, port <code>587</code>, STARTTLS (implicit TLS off).
                Use a Google App Password — not your normal login password.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel>Host</FieldLabel>
                <Input
                  value={config.credentials.host ?? ''}
                  onChange={(event) => updateCredential({ host: event.target.value })}
                  placeholder={GMAIL_SMTP_HINTS.host}
                />
              </Field>
              <Field>
                <FieldLabel>Port</FieldLabel>
                <Input
                  type="number"
                  value={config.credentials.port ?? ''}
                  onChange={(event) =>
                    updateCredential({
                      port: event.target.value === '' ? undefined : Number(event.target.value),
                    })
                  }
                  placeholder={GMAIL_SMTP_HINTS.port}
                />
                <FieldDescription>587 = STARTTLS. Use 465 + implicit TLS if your admin requires SSL.</FieldDescription>
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel>Username</FieldLabel>
                <Input
                  value={config.credentials.username ?? ''}
                  onChange={(event) => updateCredential({ username: event.target.value })}
                  placeholder={GMAIL_SMTP_HINTS.username}
                  autoComplete="off"
                />
                <FieldDescription>Full Workspace address, e.g. you@yourdomain.com</FieldDescription>
              </Field>
              <Field>
                <FieldLabel>Password</FieldLabel>
                <Input
                  type="password"
                  value={config.credentials.password ?? ''}
                  onChange={(event) => updateCredential({ password: event.target.value })}
                  placeholder={GMAIL_SMTP_HINTS.password}
                  autoComplete="new-password"
                />
                <FieldDescription>
                  Google App Password from myaccount.google.com/apppasswords. Leave masked value unchanged to keep
                  the stored password.
                </FieldDescription>
              </Field>
            </div>
            <label className="flex items-center gap-3 text-sm">
              <Checkbox
                checked={config.credentials.secure ?? false}
                onCheckedChange={(value) => updateCredential({ secure: value === true })}
              />
              <span>Use implicit TLS (port 465). Leave off for Gmail STARTTLS on port 587.</span>
            </label>
          </div>
        ) : null}

        {isApiKey ? (
          <div className="space-y-4 rounded-lg border p-4" style={{ borderColor: 'var(--border)' }}>
            <div className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--muted-foreground)' }}>
              {config.provider} credentials
            </div>
            <Field>
              <FieldLabel>API key</FieldLabel>
              <Input
                type="password"
                value={config.credentials.apiKey ?? ''}
                onChange={(event) => updateCredential({ apiKey: event.target.value })}
                placeholder="••••••••"
                autoComplete="new-password"
              />
              <FieldDescription>Leave the masked value unchanged to keep the stored key.</FieldDescription>
            </Field>
          </div>
        ) : null}

        <div className="flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-end" style={{ borderColor: 'var(--border)' }}>
          <Field className="flex-1">
            <FieldLabel>Send test email</FieldLabel>
            <Input
              type="email"
              value={testTo}
              onChange={(event) => setTestTo(event.target.value)}
              placeholder="you@example.com"
            />
            <FieldDescription>Uses the saved provider settings above.</FieldDescription>
          </Field>
          <Button type="button" variant="outline" loading={testing} disabled={loading} onClick={handleTestSend}>
            Send test
          </Button>
        </div>

        <div className="flex justify-end pt-1">
          <Button type="button" loading={saving} disabled={loading} onClick={handleSave}>
            Save email settings
          </Button>
        </div>
      </section>
    </div>
  );
}
