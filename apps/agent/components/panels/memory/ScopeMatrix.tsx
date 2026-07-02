'use client';

import React from 'react';

export type ScopeEntry = { kind: string; id?: string };

const GROUP_PRESETS = ['finance', 'operations', 'legal', 'technology'] as const;

function hasScope(scopes: ScopeEntry[], kind: string, id?: string): boolean {
  return scopes.some((s) => s.kind === kind && (id === undefined ? !s.id : s.id === id));
}

function toggleScope(
  scopes: ScopeEntry[],
  kind: string,
  id: string | undefined,
  on: boolean,
): ScopeEntry[] {
  const key = id ? `${kind}:${id}` : kind;
  const filtered = scopes.filter((s) => {
    const sk = s.id ? `${s.kind}:${s.id}` : s.kind;
    return sk !== key;
  });
  if (!on) return filtered;
  return [...filtered, id ? { kind, id } : { kind }];
}

export function ScopeMatrix({
  label,
  agentId,
  scopes,
  onChange,
}: {
  label: string;
  agentId: string;
  scopes: ScopeEntry[];
  onChange: (scopes: ScopeEntry[]) => void;
}) {
  const [customGroup, setCustomGroup] = React.useState('');

  return (
    <div className="rounded-lg border border-white/10 bg-black/30 p-3">
      <div className="text-[10px] uppercase tracking-wider text-zinc-500">{label}</div>
      <div className="mt-2 flex flex-col gap-1.5 text-[11px]">
        <label className="flex items-center gap-2 text-zinc-300 cursor-pointer">
          <input
            type="checkbox"
            checked={hasScope(scopes, 'global')}
            onChange={(e) => onChange(toggleScope(scopes, 'global', undefined, e.target.checked))}
            className="h-3 w-3 accent-violet-500"
          />
          global
        </label>
        <label className="flex items-center gap-2 text-zinc-300 cursor-pointer">
          <input
            type="checkbox"
            checked={hasScope(scopes, 'agent', agentId)}
            onChange={(e) => onChange(toggleScope(scopes, 'agent', agentId, e.target.checked))}
            className="h-3 w-3 accent-violet-500"
          />
          agent:{agentId}
        </label>
        {GROUP_PRESETS.map((g) => (
          <label key={g} className="flex items-center gap-2 text-zinc-400 cursor-pointer">
            <input
              type="checkbox"
              checked={hasScope(scopes, 'group', g)}
              onChange={(e) => onChange(toggleScope(scopes, 'group', g, e.target.checked))}
              className="h-3 w-3 accent-violet-500"
            />
            group:{g}
          </label>
        ))}
        <div className="mt-1 flex gap-2">
          <input
            value={customGroup}
            onChange={(e) => setCustomGroup(e.target.value)}
            placeholder="custom group id"
            className="flex-1 rounded border border-white/10 bg-black/40 px-2 py-1 text-[10px] outline-none transition-colors focus:border-violet-500/50"
          />
          <button
            type="button"
            className="rounded border border-white/10 px-2 text-[10px] transition-colors hover:bg-white/5"
            onClick={() => {
              const g = customGroup.trim();
              if (!g) return;
              if (!hasScope(scopes, 'group', g)) {
                onChange(toggleScope(scopes, 'group', g, true));
              }
              setCustomGroup('');
            }}
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}