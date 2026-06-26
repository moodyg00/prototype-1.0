'use client';

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

type OperationsSettings = {
  default_booking_duration: { minutes: number };
  default_availability_timezone: { timezone: string };
  booking_fields_template: { fields: Array<{ name: string; label?: string; required: boolean }> };
};

const DEFAULTS: OperationsSettings = {
  default_booking_duration: { minutes: 60 },
  default_availability_timezone: { timezone: 'America/New_York' },
  booking_fields_template: { fields: [] },
};

export function OperationsPanel(): React.ReactElement {
  const [settings, setSettings] = useState<OperationsSettings>(DEFAULTS);
  const [fieldsJson, setFieldsJson] = useState('[]');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const res = await fetch('/api/admin/settings?module=operations', { cache: 'no-store' });
        const body = (await res.json()) as {
          settings?: Array<{ key: string; value: unknown }>;
          error?: string;
        };
        if (!res.ok) throw new Error(body.error ?? 'Could not load operations settings.');

        const map = Object.fromEntries((body.settings ?? []).map((row) => [row.key, row.value]));
        const next: OperationsSettings = {
          default_booking_duration: (map.default_booking_duration as OperationsSettings['default_booking_duration']) ??
            DEFAULTS.default_booking_duration,
          default_availability_timezone:
            (map.default_availability_timezone as OperationsSettings['default_availability_timezone']) ??
            DEFAULTS.default_availability_timezone,
          booking_fields_template:
            (map.booking_fields_template as OperationsSettings['booking_fields_template']) ??
            DEFAULTS.booking_fields_template,
        };

        if (active) {
          setSettings(next);
          setFieldsJson(JSON.stringify(next.booking_fields_template.fields, null, 2));
        }
      } catch (error) {
        if (active) toast.error(error instanceof Error ? error.message : 'Could not load operations settings.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      let fields: OperationsSettings['booking_fields_template']['fields'] = [];
      try {
        const parsed = JSON.parse(fieldsJson) as unknown;
        if (!Array.isArray(parsed)) throw new Error('Booking fields template must be a JSON array.');
        fields = parsed as OperationsSettings['booking_fields_template']['fields'];
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : 'Invalid booking fields JSON.');
      }

      const payload: OperationsSettings = {
        ...settings,
        booking_fields_template: { fields },
      };

      for (const [key, value] of Object.entries(payload)) {
        const res = await fetch(`/api/admin/settings/operations/${key}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ value }),
        });
        const body = (await res.json()) as { error?: string };
        if (!res.ok) throw new Error(body.error ?? `Could not save ${key}.`);
      }

      setSettings(payload);
      toast.success('Operations settings saved.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h3 className="text-base font-semibold">Operations</h3>
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
          Scheduling and dispatch defaults stored in settings module{' '}
          <Badge variant="outline">operations</Badge>.
        </p>
      </div>

      <section className="space-y-4" aria-busy={loading}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel>Default booking duration (minutes)</FieldLabel>
            <Input
              type="number"
              min={5}
              max={480}
              value={settings.default_booking_duration.minutes}
              onChange={(event) =>
                setSettings((prev) => ({
                  ...prev,
                  default_booking_duration: { minutes: Number(event.target.value) || 60 },
                }))
              }
            />
          </Field>
          <Field>
            <FieldLabel>Default availability timezone</FieldLabel>
            <Input
              value={settings.default_availability_timezone.timezone}
              onChange={(event) =>
                setSettings((prev) => ({
                  ...prev,
                  default_availability_timezone: { timezone: event.target.value },
                }))
              }
              placeholder="America/New_York"
            />
            <FieldDescription>IANA timezone identifier used for new availability schedules.</FieldDescription>
          </Field>
        </div>

        <Field>
          <FieldLabel>Booking fields template (optional JSON)</FieldLabel>
          <Textarea
            value={fieldsJson}
            onChange={(event) => setFieldsJson(event.target.value)}
            rows={6}
            className="font-mono text-xs"
            placeholder={'[\n  { "name": "company", "label": "Company", "required": false }\n]'}
          />
          <FieldDescription>
            Array of <code>{'{ name, label?, required }'}</code> objects shown on booking forms.
          </FieldDescription>
        </Field>

        <div className="flex justify-end">
          <Button type="button" loading={saving} disabled={loading} onClick={() => void handleSave()}>
            Save operations settings
          </Button>
        </div>
      </section>
    </div>
  );
}
