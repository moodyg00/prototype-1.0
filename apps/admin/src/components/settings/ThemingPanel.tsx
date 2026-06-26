'use client';

/**
 * ThemingPanel — compact settings UI for the two-layer theme system.
 *
 * - 4 base color pickers (light/dark background + surface)
 * - Primary color selector (presets + custom hex)
 * - 5 palette options (buttons/badges/warnings/overlays)
 *
 * Both write through ThemeProvider, which:
 *   - updates CSS variables on <html>
 *   - persists to localStorage.
 */

import React, { useState } from 'react';
import {
  PRIMARY_PRESETS,
  PALETTE_PRESETS,
  useTheme,
  type PrimaryName,
  type SurfaceToken,
} from '../../providers/theme-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export function ThemingPanel() {
  const {
    lightBackground,
    lightSurface,
    darkBackground,
    darkSurface,
    surfacePreset: _surfacePreset,
    primary,
    primaryHex,
    palette,
    setPrimary,
    setPrimaryHex,
    setPalette,
    setSurfaceToken,
    applySurfacePreset: _applySurfacePreset,
    reset,
  } = useTheme();
  const [hexDraft, setHexDraft] = useState(primaryHex ?? '');

  const syncToken = (token: SurfaceToken, value: string) => setSurfaceToken(token, value);

  return (
    <div className="space-y-6">

      {/* ── SURFACES ────────────────────────────────────────────── */}
      <section className="space-y-2">
        <div className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--muted-foreground)' }}>
          Surfaces
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <ColorSwatch label="Light background" value={lightBackground} onChange={(v) => syncToken('lightBackground', v)} />
          <ColorSwatch label="Light surface" value={lightSurface} onChange={(v) => syncToken('lightSurface', v)} />
          <ColorSwatch label="Dark background"  value={darkBackground}  onChange={(v) => syncToken('darkBackground', v)} />
          <ColorSwatch label="Dark surface"  value={darkSurface}  onChange={(v) => syncToken('darkSurface', v)} />
        </div>
      </section>

      {/* ── PRIMARY COLOR ───────────────────────────────────────── */}
      <section className="space-y-2">
        <div className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--muted-foreground)' }}>
          Primary color
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {PRIMARY_PRESETS.map((p) => {
            const active = !primaryHex && primary === p.name;
            return (
              <button
                key={p.name}
                type="button"
                title={p.label}
                onClick={() => { setPrimary(p.name); setHexDraft(''); }}
                className="flex h-8 w-8 items-center justify-center rounded-full transition-transform hover:scale-110"
                style={{
                  background: p.hex,
                  outline: active ? '2px solid var(--foreground)' : '2px solid transparent',
                  outlineOffset: 2,
                  boxShadow: '0 1px 3px rgb(0 0 0/0.18)',
                }}
                aria-label={p.label}
                aria-pressed={active}
              />
            );
          })}
          {/* custom hex inline picker */}
          <label className="flex cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
            <input
              type="color"
              value={primaryHex ?? '#000000'}
              onChange={(e) => { setHexDraft(e.target.value); setPrimaryHex(e.target.value); }}
              className="h-5 w-5 cursor-pointer rounded-full border-0 bg-transparent p-0"
              title="Custom primary"
            />
            <span className="font-mono text-xs" style={{ color: 'var(--muted-foreground)' }}>
              {primaryHex ?? 'custom'}
            </span>
            {primaryHex && (
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); setPrimaryHex(null); setHexDraft(''); }}
                className="ml-0.5 text-sm leading-none"
                style={{ color: 'var(--muted-foreground)' }}
              >×</button>
            )}
          </label>
        </div>
      </section>

      {/* ── PALETTE ─────────────────────────────────────────────── */}
      <section className="space-y-2">
        <div className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--muted-foreground)' }}>
          Palette — buttons / badges / warnings / overlays
        </div>
        <div className="flex flex-wrap gap-2">
          {PALETTE_PRESETS.map((p) => {
            const active = palette === p.name;
            return (
              <button
                key={p.name}
                type="button"
                onClick={() => setPalette(p.name)}
                className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors"
                style={{
                  borderColor: active ? 'var(--foreground)' : 'var(--border)',
                  background: active ? 'color-mix(in srgb, var(--foreground) 8%, var(--card) 92%)' : 'var(--card)',
                }}
              >
                <PaletteSwatches paletteName={p.name} />
                {p.label}
                {active && <Badge variant="outline" size="sm">active</Badge>}
              </button>
            );
          })}
        </div>
      </section>

      <div className="flex justify-end pt-1">
        <Button type="button" variant="secondary" size="sm" onClick={reset}>
          Reset to defaults
        </Button>
      </div>
    </div>
  );
}

function ColorSwatch({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-6 w-6 cursor-pointer rounded border-0 bg-transparent p-0"
      />
      <div>
        <div className="text-xs font-medium leading-none">{label}</div>
        <div className="mt-0.5 font-mono text-[10px]" style={{ color: 'var(--muted-foreground)' }}>{value.toUpperCase()}</div>
      </div>
    </label>
  );
}

const PALETTE_DOT_COLORS: Record<string, string[]> = {
  default:    ['#2563eb', '#10b981', '#f59e0b', '#dc2626', '#7c3aed'],
  vivid:      ['#06b6d4', '#84cc16', '#f97316', '#ef4444', '#d946ef'],
  pastel:     ['#7dd3fc', '#86efac', '#fcd34d', '#fca5a5', '#d8b4fe'],
  monochrome: ['#94a3b8', '#cbd5e1', '#64748b', '#475569', '#1e293b'],
  sunset:     ['#fb923c', '#22c55e', '#f59e0b', '#fda4af', '#fdba74'],
};

function PaletteSwatches({ paletteName }: { paletteName: string }) {
  const dots = PALETTE_DOT_COLORS[paletteName] ?? [];
  return (
    <span className="flex gap-0.5">
      {dots.map((color) => (
        <span key={color} className="inline-block h-3 w-3 rounded-full" style={{ background: color }} />
      ))}
    </span>
  );
}

export type { PrimaryName };
