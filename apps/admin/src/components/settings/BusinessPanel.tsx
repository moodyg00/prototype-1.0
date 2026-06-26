'use client';

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type PrimaryBusiness = {
  id: string;
  name: string;
  legalName: string | null;
  ein: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
  primaryColor: string | null;
  accentColor: string | null;
  defaultPaymentTerms: string | null;
  documentIntroText: string | null;
  documentFooterText: string | null;
};

type AccountingSettings = {
  fiscal_year_start_month: { month: number };
  default_tax_rate: { rate: number };
};

const MONTHS = [
  { value: '1', label: 'January' },
  { value: '2', label: 'February' },
  { value: '3', label: 'March' },
  { value: '4', label: 'April' },
  { value: '5', label: 'May' },
  { value: '6', label: 'June' },
  { value: '7', label: 'July' },
  { value: '8', label: 'August' },
  { value: '9', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
];

export function BusinessPanel(): React.ReactElement {
  const [business, setBusiness] = useState<PrimaryBusiness | null>(null);
  const [appUrl, setAppUrl] = useState('');
  const [cronSecret, setCronSecret] = useState('');
  const [fiscalMonth, setFiscalMonth] = useState('1');
  const [taxRate, setTaxRate] = useState('0');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const [businessRes, accountingRes] = await Promise.all([
          fetch('/api/admin/business/primary', { cache: 'no-store' }),
          fetch('/api/admin/settings?module=accounting', { cache: 'no-store' }),
        ]);

        const businessBody = (await businessRes.json()) as {
          business?: PrimaryBusiness;
          appUrl?: string;
          cronSecret?: string;
          error?: string;
        };
        const accountingBody = (await accountingRes.json()) as {
          settings?: Array<{ key: string; value: unknown }>;
        };

        if (!businessRes.ok) throw new Error(businessBody.error ?? 'Could not load business.');

        if (active) {
          if (businessBody.business) setBusiness(businessBody.business);
          setAppUrl(businessBody.appUrl ?? '');
          setCronSecret(businessBody.cronSecret ?? '');

          const accounting = Object.fromEntries(
            (accountingBody.settings ?? []).map((row) => [row.key, row.value]),
          ) as Partial<AccountingSettings>;

          setFiscalMonth(String(accounting.fiscal_year_start_month?.month ?? 1));
          setTaxRate(String(accounting.default_tax_rate?.rate ?? 0));
        }
      } catch (error) {
        if (active) toast.error(error instanceof Error ? error.message : 'Could not load business settings.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const updateBusiness = (patch: Partial<PrimaryBusiness>) => {
    setBusiness((prev) => (prev ? { ...prev, ...patch } : prev));
  };

  const handleSave = async () => {
    if (!business) return;
    setSaving(true);
    try {
      const businessRes = await fetch('/api/admin/business/primary', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ business, appUrl, cronSecret }),
      });
      const businessBody = (await businessRes.json()) as {
        error?: string;
        business?: PrimaryBusiness;
        cronSecret?: string;
      };
      if (!businessRes.ok) throw new Error(businessBody.error ?? 'Save failed.');

      const accountingPayload = [
        { key: 'fiscal_year_start_month', value: { month: Number(fiscalMonth) } },
        { key: 'default_tax_rate', value: { rate: Number(taxRate) } },
      ];

      for (const item of accountingPayload) {
        const res = await fetch(`/api/admin/settings/accounting/${item.key}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ value: item.value }),
        });
        const body = (await res.json()) as { error?: string };
        if (!res.ok) throw new Error(body.error ?? `Could not save ${item.key}.`);
      }

      if (businessBody.business) setBusiness(businessBody.business);
      if (businessBody.cronSecret !== undefined) setCronSecret(businessBody.cronSecret);
      toast.success('Business settings saved.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h3 className="text-base font-semibold">Business</h3>
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
          Primary business profile used on documents and customer-facing pages. Stored in the{' '}
          <Badge variant="outline">businesses</Badge> table (<code>is_primary</code>).
        </p>
      </div>

      <section className="space-y-4" aria-busy={loading}>
        <Field>
          <FieldLabel>App URL</FieldLabel>
          <Input
            value={appUrl}
            onChange={(event) => setAppUrl(event.target.value)}
            placeholder="https://app.example.com"
          />
          <FieldDescription>
            Public base URL for booking links and emails. Stored in settings module{' '}
            <Badge variant="outline">system</Badge> key <code>app</code>.
          </FieldDescription>
        </Field>

        <Field>
          <FieldLabel>Cron secret</FieldLabel>
          <Input
            type="password"
            value={cronSecret}
            onChange={(event) => setCronSecret(event.target.value)}
            placeholder="Bearer token for scheduled jobs"
            autoComplete="off"
          />
          <FieldDescription>
            Authenticates <code>/api/cron/*</code> routes and the worker job runner. Must match{' '}
            <code>CRON_SECRET</code> on the worker. Leave masked value unchanged to keep the current
            secret.
          </FieldDescription>
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel>Business name</FieldLabel>
            <Input
              value={business?.name ?? ''}
              onChange={(event) => updateBusiness({ name: event.target.value })}
              placeholder="Acme Services"
            />
          </Field>
          <Field>
            <FieldLabel>Legal name</FieldLabel>
            <Input
              value={business?.legalName ?? ''}
              onChange={(event) => updateBusiness({ legalName: event.target.value || null })}
              placeholder="Acme Services LLC"
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field>
            <FieldLabel>Email</FieldLabel>
            <Input
              type="email"
              value={business?.email ?? ''}
              onChange={(event) => updateBusiness({ email: event.target.value || null })}
            />
          </Field>
          <Field>
            <FieldLabel>Phone</FieldLabel>
            <Input
              value={business?.phone ?? ''}
              onChange={(event) => updateBusiness({ phone: event.target.value || null })}
            />
          </Field>
          <Field>
            <FieldLabel>Website</FieldLabel>
            <Input
              value={business?.website ?? ''}
              onChange={(event) => updateBusiness({ website: event.target.value || null })}
            />
          </Field>
        </div>

        <Field>
          <FieldLabel>Address</FieldLabel>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              value={business?.addressLine1 ?? ''}
              onChange={(event) => updateBusiness({ addressLine1: event.target.value || null })}
              placeholder="Street address"
            />
            <Input
              value={business?.addressLine2 ?? ''}
              onChange={(event) => updateBusiness({ addressLine2: event.target.value || null })}
              placeholder="Suite / unit"
            />
            <Input
              value={business?.city ?? ''}
              onChange={(event) => updateBusiness({ city: event.target.value || null })}
              placeholder="City"
            />
            <Input
              value={business?.state ?? ''}
              onChange={(event) => updateBusiness({ state: event.target.value || null })}
              placeholder="State"
            />
            <Input
              value={business?.postalCode ?? ''}
              onChange={(event) => updateBusiness({ postalCode: event.target.value || null })}
              placeholder="Postal code"
            />
            <Input
              value={business?.country ?? 'US'}
              onChange={(event) => updateBusiness({ country: event.target.value || null })}
              placeholder="Country"
            />
          </div>
        </Field>

        <Field>
          <FieldLabel>Default payment terms</FieldLabel>
          <Textarea
            value={business?.defaultPaymentTerms ?? ''}
            onChange={(event) => updateBusiness({ defaultPaymentTerms: event.target.value || null })}
            rows={2}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel>Document intro text</FieldLabel>
            <Textarea
              value={business?.documentIntroText ?? ''}
              onChange={(event) => updateBusiness({ documentIntroText: event.target.value || null })}
              rows={3}
            />
          </Field>
          <Field>
            <FieldLabel>Document footer text</FieldLabel>
            <Textarea
              value={business?.documentFooterText ?? ''}
              onChange={(event) => updateBusiness({ documentFooterText: event.target.value || null })}
              rows={3}
            />
          </Field>
        </div>
      </section>

      <section className="space-y-4 rounded-lg border p-4" style={{ borderColor: 'var(--border)' }}>
        <div className="space-y-1">
          <h4 className="text-sm font-semibold">Accounting defaults</h4>
          <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
            Stub values stored in settings module <Badge variant="outline">accounting</Badge>.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel>Fiscal year start month</FieldLabel>
            <Select value={fiscalMonth} onValueChange={setFiscalMonth}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectPopup>
                {MONTHS.map((month) => (
                  <SelectItem key={month.value} value={month.value}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectPopup>
            </Select>
          </Field>
          <Field>
            <FieldLabel>Default tax rate (%)</FieldLabel>
            <Input
              type="number"
              min={0}
              max={100}
              step="0.01"
              value={taxRate}
              onChange={(event) => setTaxRate(event.target.value)}
            />
          </Field>
        </div>
      </section>

      <div className="flex justify-end">
        <Button type="button" loading={saving} disabled={loading || !business} onClick={() => void handleSave()}>
          Save business settings
        </Button>
      </div>
    </div>
  );
}
