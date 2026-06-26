'use client';

/**
 * ThemeProvider
 *
 * Two independent theme dimensions (user-configurable):
 *   - primary color scheme:  named preset OR custom hex
 *   - palette:              named pill/badge palette
 *
 * Surface / background tokens are fixed in CSS (globals.css) and applied on
 * <html> at runtime — not derived from primary or user selection.
 *
 * Persistence: localStorage. SSR hydration via `initial` prop when wired to Prisma.
 */

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export type ModeName = 'light' | 'dark';

export type PrimaryName =
  | 'violet'
  | 'indigo'
  | 'blue'
  | 'cyan'
  | 'emerald'
  | 'amber'
  | 'rose'
  | 'slate';

export const PRIMARY_PRESETS: { name: PrimaryName; label: string; hex: string; soft: string }[] = [
  { name: 'violet',  label: 'Violet',  hex: '#7c3aed', soft: '#ede9fe' },
  { name: 'indigo',  label: 'Indigo',  hex: '#4f46e5', soft: '#e0e7ff' },
  { name: 'blue',    label: 'Blue',    hex: '#2563eb', soft: '#dbeafe' },
  { name: 'cyan',    label: 'Cyan',    hex: '#0891b2', soft: '#cffafe' },
  { name: 'emerald', label: 'Emerald', hex: '#059669', soft: '#d1fae5' },
  { name: 'amber',   label: 'Orange',  hex: '#ff8f33', soft: '#ffe8d4' },
  { name: 'rose',    label: 'Rose',    hex: '#e11d48', soft: '#ffe4e6' },
  { name: 'slate',   label: 'Slate',   hex: '#0f172a', soft: '#e2e8f0' },
];

export type PaletteName = 'default' | 'vivid' | 'pastel' | 'monochrome' | 'sunset';

export const PALETTE_PRESETS: { name: PaletteName; label: string; description: string }[] = [
  { name: 'default',    label: 'Default',    description: 'Tailwind weights with saturated semantics.' },
  { name: 'vivid',      label: 'Vivid',      description: 'High-saturation neons for emphasis.' },
  { name: 'pastel',     label: 'Pastel',     description: 'Soft tints for calmer surfaces.' },
  { name: 'monochrome', label: 'Monochrome', description: 'Slate gradient, single accent.' },
  { name: 'sunset',     label: 'Sunset',     description: 'Warm oranges and coral accents for contrast-heavy UI.' },
];

/** Fixed light/dark surface tokens — not user-configurable. */
const FIXED_LIGHT_TOKENS: Record<string, string> = {
  background: '#ffffff',
  foreground: '#0f172a',
  surface: '#fafafa',
  'card-foreground': '#0f172a',
  popover: '#fafafa',
  'popover-foreground': '#0f172a',
  border: '#d9dadd',
  input: '#d4d6d9',
  muted: '#fcfcfc',
  'muted-foreground': '#646975',
  accent: '#dedfe1',
  'accent-foreground': '#0f172a',
};

const FIXED_DARK_TOKENS: Record<string, string> = {
  background: '#000000',
  foreground: '#f8fafc',
  surface: '#222325',
  'card-foreground': '#f8fafc',
  popover: '#222325',
  'popover-foreground': '#f8fafc',
  border: '#494a4c',
  input: '#4d4e50',
  muted: '#18191b',
  'muted-foreground': '#9ea0a2',
  accent: '#1f2126',
  'accent-foreground': '#f8fafc',
};

export interface ThemeState {
  mode: ModeName;
  primary: PrimaryName;
  primaryHex: string | null;
  palette: PaletteName;
}

const DEFAULT_THEME: ThemeState = {
  mode: 'light',
  primary: 'amber',
  primaryHex: null,
  palette: 'default',
};

const STORAGE_KEY = 'proto2.theme';
const DEFAULT_PRIMARY_HEX = '#ff8f33';

interface ThemeContextValue extends ThemeState {
  setMode: (next: ModeName) => void;
  setPrimary: (next: PrimaryName) => void;
  setPrimaryHex: (hex: string | null) => void;
  setPalette: (next: PaletteName) => void;
  reset: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readStored(): ThemeState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ThemeState>;
    return {
      mode: parsed.mode === 'dark' ? 'dark' : DEFAULT_THEME.mode,
      primary: (parsed.primary as PrimaryName) ?? DEFAULT_THEME.primary,
      primaryHex: typeof parsed.primaryHex === 'string' ? parsed.primaryHex : null,
      palette: (parsed.palette as PaletteName) ?? DEFAULT_THEME.palette,
    };
  } catch {
    return null;
  }
}

function softenHex(hex: string, alpha = 0.15): string {
  const v = hex.replace('#', '');
  if (v.length !== 6) return hex;
  const r = parseInt(v.slice(0, 2), 16);
  const g = parseInt(v.slice(2, 4), 16);
  const b = parseInt(v.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function normalizeHex(hex: string | null | undefined, fallback: string): string {
  return typeof hex === 'string' && /^#[0-9a-fA-F]{6}$/.test(hex) ? hex.toLowerCase() : fallback;
}

function primaryHexFor(state: ThemeState): string {
  if (state.primaryHex) return normalizeHex(state.primaryHex, DEFAULT_PRIMARY_HEX);
  return PRIMARY_PRESETS.find((preset) => preset.name === state.primary)?.hex ?? DEFAULT_PRIMARY_HEX;
}

function applyFixedModeTokens(html: HTMLElement, mode: 'light' | 'dark') {
  const tokens = mode === 'light' ? FIXED_LIGHT_TOKENS : FIXED_DARK_TOKENS;
  for (const [key, value] of Object.entries(tokens)) {
    html.style.setProperty(`--${mode}-${key}`, value);
  }
}

function applyToDom(state: ThemeState) {
  if (typeof document === 'undefined') return;
  const html = document.documentElement;
  const primaryHex = primaryHexFor(state);
  html.classList.toggle('dark', state.mode === 'dark');
  html.setAttribute('data-primary', state.primary);
  html.setAttribute('data-palette', state.palette);
  applyFixedModeTokens(html, 'light');
  applyFixedModeTokens(html, 'dark');

  if (state.primaryHex) {
    html.style.setProperty('--primary', primaryHex);
    html.style.setProperty('--primary-soft', softenHex(primaryHex, 0.18));
    html.style.setProperty('--ring', primaryHex);
  } else {
    html.style.removeProperty('--primary');
    html.style.removeProperty('--primary-soft');
    html.style.removeProperty('--ring');
  }
}

interface ProviderProps {
  initial?: Partial<ThemeState>;
  children: React.ReactNode;
}

export function ThemeProvider({ initial, children }: ProviderProps) {
  const [state, setState] = useState<ThemeState>(() => {
    const stored = readStored();
    return {
      ...DEFAULT_THEME,
      ...(initial ?? {}),
      ...(stored ?? {}),
    };
  });

  useEffect(() => {
    applyToDom(state);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore quota errors
    }
  }, [state]);

  const setMode = useCallback((next: ModeName) => {
    setState((s) => ({ ...s, mode: next }));
  }, []);

  const setPrimary = useCallback((next: PrimaryName) => {
    setState((s) => ({ ...s, primary: next, primaryHex: null }));
  }, []);
  const setPrimaryHex = useCallback((hex: string | null) => {
    setState((s) => ({ ...s, primaryHex: hex }));
  }, []);
  const setPalette = useCallback((next: PaletteName) => {
    setState((s) => ({ ...s, palette: next }));
  }, []);
  const reset = useCallback(() => setState(DEFAULT_THEME), []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      ...state,
      setMode,
      setPrimary,
      setPrimaryHex,
      setPalette,
      reset,
    }),
    [state, setMode, setPrimary, setPrimaryHex, setPalette, reset]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}

const FIXED_LIGHT_TOKENS_JSON = JSON.stringify(FIXED_LIGHT_TOKENS);
const FIXED_DARK_TOKENS_JSON = JSON.stringify(FIXED_DARK_TOKENS);

/**
 * First-paint script. Inlined as a string into <head> via Next's
 * dangerouslySetInnerHTML so the user never sees a flash of the default
 * theme on initial load.
 */
export const themeBootstrapScript = `
(function () {
  try {
    function normalizeHex(hex, fallback) {
      return typeof hex === 'string' && /^#[0-9a-fA-F]{6}$/.test(hex) ? hex.toLowerCase() : fallback;
    }
    function hexToRgb(hex) {
      var normalized = normalizeHex(hex, '#000000').slice(1);
      return [
        parseInt(normalized.slice(0, 2), 16),
        parseInt(normalized.slice(2, 4), 16),
        parseInt(normalized.slice(4, 6), 16)
      ];
    }
    function primaryHexFor(t) {
      var presets = {
        violet: '#7c3aed',
        indigo: '#4f46e5',
        blue: '#2563eb',
        cyan: '#0891b2',
        emerald: '#059669',
        amber: '#ff8f33',
        rose: '#e11d48',
        slate: '#0f172a'
      };
      return t.primaryHex ? normalizeHex(t.primaryHex, '${DEFAULT_PRIMARY_HEX}') : (presets[t.primary] || '${DEFAULT_PRIMARY_HEX}');
    }
    function softenHex(hex, alpha) {
      var rgb = hexToRgb(hex);
      return 'rgba(' + rgb[0] + ', ' + rgb[1] + ', ' + rgb[2] + ', ' + alpha + ')';
    }
    function applyFixedModeTokens(html, mode, tokens) {
      for (var key in tokens) {
        if (Object.prototype.hasOwnProperty.call(tokens, key)) {
          html.style.setProperty('--' + mode + '-' + key, tokens[key]);
        }
      }
    }
    var lightTokens = ${FIXED_LIGHT_TOKENS_JSON};
    var darkTokens = ${FIXED_DARK_TOKENS_JSON};
    var raw = localStorage.getItem('${STORAGE_KEY}');
    var html = document.documentElement;
    applyFixedModeTokens(html, 'light', lightTokens);
    applyFixedModeTokens(html, 'dark', darkTokens);
    if (!raw) {
      html.setAttribute('data-primary', 'amber');
      return;
    }
    var t = JSON.parse(raw);
    var primary = primaryHexFor(t);
    html.classList.toggle('dark', t.mode === 'dark');
    if (t.primary) html.setAttribute('data-primary', t.primary);
    if (t.palette) html.setAttribute('data-palette', t.palette);
    if (t.primaryHex) {
      html.style.setProperty('--primary', primary);
      html.style.setProperty('--primary-soft', softenHex(primary, 0.18));
      html.style.setProperty('--ring', primary);
    }
  } catch (_) {}
})();
`.trim();
