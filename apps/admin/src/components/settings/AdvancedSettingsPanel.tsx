'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { PROTECTED_SYSTEM_KEYS } from '@/src/lib/settings/registry';

type SettingRow = {
  id: string;
  module: string;
  key: string;
  value: unknown;
  description: string | null;
  isSensitive: boolean;
};

interface Props {
  modules?: string[];
}

function isProtectedRow(row: Pick<SettingRow, 'module' | 'key'>): boolean {
  if (row.module === 'system') {
    return (PROTECTED_SYSTEM_KEYS as readonly string[]).includes(row.key);
  }
  return false;
}

export function AdvancedSettingsPanel({ modules }: Props): React.ReactElement {
  const [settings, setSettings] = useState<SettingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterModule, setFilterModule] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('{}');
  const [editDescription, setEditDescription] = useState('');
  const [draftModule, setDraftModule] = useState('');
  const [draftKey, setDraftKey] = useState('');
  const [draftValue, setDraftValue] = useState('{}');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const query = filterModule.trim() ? `?module=${encodeURIComponent(filterModule.trim())}` : '';
      const res = await fetch(`/api/admin/settings${query}`, { cache: 'no-store' });
      const body = (await res.json()) as { settings?: SettingRow[]; error?: string };
      if (!res.ok) throw new Error(body.error ?? 'Could not load settings.');

      let rows = body.settings ?? [];
      if (modules?.length) {
        rows = rows.filter((row) => modules.includes(row.module));
      }
      setSettings(rows);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not load settings.');
    } finally {
      setLoading(false);
    }
  }, [filterModule, modules]);

  useEffect(() => {
    void load();
  }, [load]);

  const startEdit = (row: SettingRow) => {
    setEditingId(row.id);
    setEditValue(JSON.stringify(row.value, null, 2));
    setEditDescription(row.description ?? '');
  };

  const saveEdit = async (row: SettingRow) => {
    setSaving(true);
    try {
      const value = JSON.parse(editValue) as unknown;
      const res = await fetch(`/api/admin/settings/${row.module}/${row.key}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value, description: editDescription || null }),
      });
      const body = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(body.error ?? 'Save failed.');
      setEditingId(null);
      toast.success('Setting updated.');
      void load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const deleteRow = async (row: SettingRow) => {
    if (isProtectedRow(row)) {
      toast.error('System settings cannot be deleted.');
      return;
    }
    if (!window.confirm(`Delete ${row.module}/${row.key}?`)) return;
    try {
      const res = await fetch(`/api/admin/settings/${row.module}/${row.key}`, { method: 'DELETE' });
      const body = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(body.error ?? 'Delete failed.');
      toast.success('Setting deleted.');
      void load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Delete failed.');
    }
  };

  const createRow = async () => {
    const module = draftModule.trim();
    const key = draftKey.trim();
    if (!module || !key) {
      toast.error('Module and key are required.');
      return;
    }
    if (module === 'system' && (PROTECTED_SYSTEM_KEYS as readonly string[]).includes(key)) {
      toast.error('Use dedicated UI for system app/cron settings.');
      return;
    }

    setSaving(true);
    try {
      const value = JSON.parse(draftValue) as unknown;
      const res = await fetch(`/api/admin/settings/${module}/${key}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value }),
      });
      const body = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(body.error ?? 'Create failed.');
      setDraftModule('');
      setDraftKey('');
      setDraftValue('{}');
      toast.success('Setting created.');
      void load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Create failed.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h3 className="text-base font-semibold">Advanced settings editor</h3>
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
          Raw module/key JSON editor. System keys <code>app</code> and <code>cron</code> are protected from deletion.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <Field className="max-w-xs">
          <FieldLabel>Filter by module</FieldLabel>
          <Input
            value={filterModule}
            onChange={(event) => setFilterModule(event.target.value)}
            placeholder="operations"
          />
        </Field>
        <Button type="button" variant="outline" onClick={() => void load()}>
          Refresh
        </Button>
      </div>

      <div className="rounded-xl border p-4 space-y-3" style={{ borderColor: 'var(--border)' }}>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Create setting</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            value={draftModule}
            onChange={(event) => setDraftModule(event.target.value)}
            placeholder="module"
          />
          <Input value={draftKey} onChange={(event) => setDraftKey(event.target.value)} placeholder="key" />
        </div>
        <Textarea
          value={draftValue}
          onChange={(event) => setDraftValue(event.target.value)}
          rows={4}
          className="font-mono text-xs"
        />
        <Button type="button" size="sm" loading={saving} onClick={() => void createRow()}>
          <Plus className="h-4 w-4" />
          Add setting
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading settings…</p>
      ) : settings.length === 0 ? (
        <p className="text-sm text-muted-foreground">No settings rows match this filter.</p>
      ) : (
        <div className="space-y-3">
          {settings.map((row) => (
            <div
              key={row.id}
              className="rounded-xl border p-4 space-y-3"
              style={{ borderColor: 'var(--border)' }}
            >
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{row.module}</Badge>
                <code className="text-sm">{row.key}</code>
                {row.isSensitive ? <Badge variant="secondary">Sensitive</Badge> : null}
                {isProtectedRow(row) ? <Badge variant="secondary">Protected</Badge> : null}
              </div>

              {editingId === row.id ? (
                <div className="space-y-3">
                  <Field>
                    <FieldLabel>Description</FieldLabel>
                    <Input value={editDescription} onChange={(event) => setEditDescription(event.target.value)} />
                  </Field>
                  <Field>
                    <FieldLabel>Value (JSON)</FieldLabel>
                    <Textarea
                      value={editValue}
                      onChange={(event) => setEditValue(event.target.value)}
                      rows={8}
                      className="font-mono text-xs"
                    />
                    {row.isSensitive ? (
                      <FieldDescription>
                        Secrets are masked in the API. Send a new value to replace; leave mask to preserve.
                      </FieldDescription>
                    ) : null}
                  </Field>
                  <div className="flex gap-2">
                    <Button type="button" size="sm" loading={saving} onClick={() => void saveEdit(row)}>
                      Save
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => setEditingId(null)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {row.description ? (
                    <p className="text-xs text-muted-foreground">{row.description}</p>
                  ) : null}
                  <pre
                    className="overflow-x-auto rounded-lg p-3 text-xs"
                    style={{ background: 'var(--muted)' }}
                  >
                    {JSON.stringify(row.value, null, 2)}
                  </pre>
                  <div className="flex gap-2">
                    <Button type="button" size="sm" variant="outline" onClick={() => startEdit(row)}>
                      Edit
                    </Button>
                    {!isProtectedRow(row) ? (
                      <Button type="button" size="sm" variant="outline" onClick={() => void deleteRow(row)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    ) : null}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
