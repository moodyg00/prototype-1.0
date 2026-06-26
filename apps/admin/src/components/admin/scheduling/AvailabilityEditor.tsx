'use client';

import * as React from 'react';
import { Plus, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { LAYER_META } from '@/src/lib/scheduling/events';
import {
  AVAILABILITY_LAYER_KEYS,
  type AvailabilityLayerKey,
  type AvailabilitySubjectKind,
} from '@/src/lib/validation/scheduling';
import { cn } from '@/src/lib/utils';

import { WEEKDAY_SHORT } from './calendar-utils';

interface ApiRule {
  id: string;
  subjectKind: AvailabilitySubjectKind;
  businessId: string | null;
  contactId: string | null;
  userId: string | null;
  serviceId: string | null;
  layerKey: AvailabilityLayerKey;
  availabilityType: 'recurring' | 'specific_date' | 'blocked';
  dayOfWeek: number | null;
  specificDate: string | null;
  startTime: string | null;
  endTime: string | null;
  isAvailable: boolean;
  isPublished: boolean;
  timezone: string;
  notes: string | null;
}

interface EditRule extends ApiRule {
  _key: string;
}

const TIME_OPTIONS = (() => {
  const out: string[] = [];
  for (let h = 6; h <= 20; h += 1) {
    out.push(`${String(h).padStart(2, '0')}:00`, `${String(h).padStart(2, '0')}:30`);
  }
  return out;
})();

const SUBJECT_FOR_LAYER: Record<AvailabilityLayerKey, AvailabilitySubjectKind> = {
  contractor: 'contact',
  contact: 'contact',
  owner: 'user',
  business: 'business',
  service: 'service',
};

function toHM(value: string | null): string {
  if (!value) return '';
  const m = /T(\d{2}:\d{2})/.exec(value) ?? /^(\d{2}:\d{2})/.exec(value);
  return m ? m[1] : '';
}

let keyCounter = 0;
function nextKey(): string {
  keyCounter += 1;
  return `new-${keyCounter}`;
}

export function AvailabilityEditor({ onSaved }: { onSaved?: () => void }): React.ReactElement {
  const [rules, setRules] = React.useState<EditRule[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/availability-rules');
      const body = (await res.json()) as { rules?: ApiRule[] };
      setRules(
        (body.rules ?? []).map((r) => ({
          ...r,
          startTime: toHM(r.startTime),
          endTime: toHM(r.endTime),
          specificDate: r.specificDate ? r.specificDate.slice(0, 10) : null,
          _key: r.id,
        })),
      );
    } catch {
      toast.error('Could not load availability rules.');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const updateRule = (key: string, patch: Partial<EditRule>) => {
    setRules((prev) => prev.map((r) => (r._key === key ? { ...r, ...patch } : r)));
  };

  const removeRule = (key: string) => {
    setRules((prev) => prev.filter((r) => r._key !== key));
  };

  const addRule = (layer: AvailabilityLayerKey) => {
    setRules((prev) => [
      ...prev,
      {
        _key: nextKey(),
        id: nextKey(),
        subjectKind: SUBJECT_FOR_LAYER[layer],
        businessId: null,
        contactId: null,
        userId: null,
        serviceId: null,
        layerKey: layer,
        availabilityType: 'recurring',
        dayOfWeek: 1,
        specificDate: null,
        startTime: '09:00',
        endTime: '17:00',
        isAvailable: true,
        isPublished: true,
        timezone: 'America/Chicago',
        notes: null,
      },
    ]);
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        rules: rules.map((r) => ({
          subjectKind: r.subjectKind,
          businessId: r.businessId ?? undefined,
          contactId: r.contactId ?? undefined,
          userId: r.userId ?? undefined,
          serviceId: r.serviceId ?? undefined,
          layerKey: r.layerKey,
          availabilityType: r.availabilityType,
          dayOfWeek: r.availabilityType === 'recurring' ? (r.dayOfWeek ?? 0) : undefined,
          specificDate: r.availabilityType !== 'recurring' ? (r.specificDate ?? undefined) : undefined,
          startTime: r.startTime || undefined,
          endTime: r.endTime || undefined,
          isAvailable: r.isAvailable,
          isPublished: r.isPublished,
          timezone: r.timezone,
          notes: r.notes ?? undefined,
        })),
      };
      const res = await fetch('/api/admin/availability-rules', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? 'Save failed.');
      }
      toast.success('Availability published.');
      await load();
      onSaved?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save availability.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Availability editor</h3>
          <p className="text-xs text-muted-foreground">
            Publish availability per layer. Each user publishes their own; admins can add business hours and others.
          </p>
        </div>
        <Button size="sm" onClick={save} loading={saving} disabled={loading}>
          <Save className="h-4 w-4" />
          Publish
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <div className="space-y-5">
          {AVAILABILITY_LAYER_KEYS.map((layer) => {
            const layerRules = rules.filter((r) => r.layerKey === layer);
            return (
              <section
                key={layer}
                className="rounded-xl border p-4"
                style={{ borderColor: 'var(--border)' }}
              >
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <span
                      aria-hidden
                      className="inline-block h-2.5 w-2.5 rounded-full"
                      style={{ background: LAYER_META[layer].color }}
                    />
                    {LAYER_META[layer].label}
                    <span className="text-xs text-muted-foreground">({layerRules.length})</span>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => addRule(layer)}>
                    <Plus className="h-4 w-4" />
                    Add window
                  </Button>
                </div>

                {layerRules.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No published windows.</p>
                ) : (
                  <div className="space-y-2">
                    {layerRules.map((rule) => (
                      <div
                        key={rule._key}
                        className="flex flex-wrap items-center gap-2 rounded-lg border px-3 py-2"
                        style={{ borderColor: 'var(--border)' }}
                      >
                        {rule.availabilityType === 'recurring' ? (
                          <select
                            value={rule.dayOfWeek ?? 0}
                            onChange={(e) => updateRule(rule._key, { dayOfWeek: Number(e.target.value) })}
                            className="h-9 rounded-md border bg-background px-2 text-sm"
                            style={{ borderColor: 'var(--border)' }}
                          >
                            {WEEKDAY_SHORT.map((d, i) => (
                              <option key={d} value={i}>
                                {d}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="date"
                            value={rule.specificDate ?? ''}
                            onChange={(e) => updateRule(rule._key, { specificDate: e.target.value })}
                            className="h-9 rounded-md border bg-background px-2 text-sm"
                            style={{ borderColor: 'var(--border)' }}
                          />
                        )}

                        <select
                          value={rule.startTime ?? ''}
                          onChange={(e) => updateRule(rule._key, { startTime: e.target.value })}
                          className="h-9 rounded-md border bg-background px-2 text-sm"
                          style={{ borderColor: 'var(--border)' }}
                        >
                          {TIME_OPTIONS.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                        <span className="text-xs text-muted-foreground">to</span>
                        <select
                          value={rule.endTime ?? ''}
                          onChange={(e) => updateRule(rule._key, { endTime: e.target.value })}
                          className="h-9 rounded-md border bg-background px-2 text-sm"
                          style={{ borderColor: 'var(--border)' }}
                        >
                          {TIME_OPTIONS.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>

                        <button
                          type="button"
                          onClick={() => updateRule(rule._key, { isAvailable: !rule.isAvailable })}
                          className={cn(
                            'rounded-full border px-2.5 py-1 text-xs font-medium',
                            rule.isAvailable
                              ? 'border-transparent bg-emerald-100 text-emerald-800'
                              : 'border-transparent bg-muted text-muted-foreground',
                          )}
                        >
                          {rule.isAvailable ? 'Available' : 'Blocked'}
                        </button>

                        <button
                          type="button"
                          onClick={() => removeRule(rule._key)}
                          className="ms-auto text-muted-foreground hover:text-destructive-foreground"
                          aria-label="Remove window"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
