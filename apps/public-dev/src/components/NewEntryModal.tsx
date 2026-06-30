'use client';

import { useEffect, useState } from 'react';
import { FilePlus2, FolderPlus, Loader2, X } from 'lucide-react';

function normalizePath(raw: string): string {
  return raw
    .trim()
    .replace(/\\/g, '/')
    .replace(/^\/+/, '')
    .replace(/\/+$/, '');
}

export function NewEntryModal({
  kind,
  defaultPath = '',
  onClose,
  onCreate,
}: {
  kind: 'file' | 'dir';
  defaultPath?: string;
  onClose: () => void;
  onCreate: (path: string) => Promise<void>;
}) {
  const [path, setPath] = useState(defaultPath);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const normalized = normalizePath(path);
  const valid = normalized.length > 0 && !normalized.includes('..');

  useEffect(() => {
    setPath(defaultPath);
    setError(null);
  }, [kind, defaultPath]);

  const create = async () => {
    if (!valid || saving) return;
    setSaving(true);
    setError(null);
    try {
      await onCreate(normalized);
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const isFile = kind === 'file';
  const Icon = isFile ? FilePlus2 : FolderPlus;
  const title = isFile ? 'New file' : 'New folder';
  const placeholder = isFile ? 'about.html or css/new.css' : 'images or assets/icons';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-[var(--color-border)] px-4 py-3">
          <Icon size={16} className="text-[var(--color-accent)]" />
          <h2 className="font-semibold">{title}</h2>
          <button type="button" onClick={onClose} className="ml-auto text-[var(--color-muted)] hover:text-[var(--color-fg)]">
            <X size={18} />
          </button>
        </div>
        <div className="space-y-3 p-4 text-sm">
          <label className="block">
            <span className="mb-1 block text-xs text-[var(--color-muted)]">Path (relative to project root)</span>
            <input
              autoFocus
              value={path}
              onChange={(e) => setPath(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && create()}
              placeholder={placeholder}
              className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-panel-2)] px-2 py-1.5 font-mono outline-none focus:border-[var(--color-accent)]"
            />
          </label>
          <p className="text-xs text-[var(--color-muted)]">
            Use forward slashes for nested paths. Parent folders are created automatically.
          </p>
          {error && <p className="text-xs text-[var(--color-danger)]">{error}</p>}
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-[var(--color-border)] px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-[var(--color-border)] px-3 py-1.5 text-sm hover:bg-[var(--color-panel-2)]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={create}
            disabled={!valid || saving}
            className="flex items-center gap-1 rounded-md bg-[var(--color-accent)] px-3 py-1.5 text-sm font-medium text-[var(--color-accent-fg)] hover:opacity-90 disabled:opacity-40"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Icon size={14} />} Create
          </button>
        </div>
      </div>
    </div>
  );
}
