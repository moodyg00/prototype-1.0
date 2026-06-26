'use client';

/**
 * ThemeProvider
 *
 * Two independent theme dimensions:
 *   - primary color scheme:  named preset OR custom hex
 *       Stored as { primary: 'violet' | 'indigo' | ..., primaryHex?: '#aabbcc' }
 *   - palette:              named pill/badge palette
 *       Stored as { palette: 'default' | 'vivid' | 'pastel' | 'monochrome' }
 *
 * Persistence strategy:
 *   - First paint reads localStorage to avoid a flash of default theme.
 *   - Updates are written to localStorage immediately.
 *   - When wired to Prisma later, server-side data is hydrated through the
 *     `initial` prop in <ThemeProvider initial={...}> so SSR matches client.
 *
 * Application strategy:
 *   - Sets `data-primary` on <html> for named presets.
 *   - Sets inline CSS variables on <html> for editable surfaces and derives
 *     readable text, border, muted, and accent tokens from those surfaces.
 *   - Sets `data-palette` on <html> for the secondary palette.
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
  { name: 'amber',   label: 'Amber',   hex: '#d97706', soft: '#fef3c7' },
  { name: 'rose',    label: 'Rose',    hex: '#e11d48', soft: '#ffe4e6' },
  { name: 'slate',   label: 'Slate',   hex: '#0f172a', soft: '#e2e8f0' },
];

export type PaletteName = 'default' | 'vivid' | 'pastel' | 'monochrome' | 'sunset';

export type SurfacePresetName = 'pure' | 'slate' | 'cream' | 'ocean';
export type SurfaceToken = 'lightBackground' | 'lightSurface' | 'darkBackground' | 'darkSurface';

export const PALETTE_PRESETS: { name: PaletteName; label: string; description: string }[] = [
  { name: 'default',    label: 'Default',    description: 'Tailwind weights with saturated semantics.' },
  { name: 'vivid',      label: 'Vivid',      description: 'High-saturation neons for emphasis.' },
  { name: 'pastel',     label: 'Pastel',     description: 'Soft tints for calmer surfaces.' },
  { name: 'monochrome', label: 'Monochrome', description: 'Slate gradient, single accent.' },
  { name: 'sunset',     label: 'Sunset',     description: 'Warm oranges and coral accents for contrast-heavy UI.' },
];

export const SURFACE_PRESETS: Array<{
  name: SurfacePresetName;
  label: string;
  description: string;
  lightBackground: string;
  lightSurface: string;
  darkBackground: string;
  darkSurface: string;
}> = [
  {
    name: 'pure',
    label: 'Pure',
    description: 'White-white and black-black with crisp contrast.',
    lightBackground: '#ffffff',
    lightSurface: '#f8fafc',
    darkBackground: '#000000',
    darkSurface: '#0f172a',
  },
  {
    name: 'slate',
    label: 'Slate',
    description: 'Cool neutral surfaces with a slightly grayer light mode.',
    lightBackground: '#f8fafc',
    lightSurface: '#eef2f7',
    darkBackground: '#020617',
    darkSurface: '#111827',
  },
  {
    name: 'cream',
    label: 'Cream',
    description: 'Warm editorial light mode with a mossy dark base.',
    lightBackground: '#fffdf7',
    lightSurface: '#f7f1e6',
    darkBackground: '#0b0f0c',
    darkSurface: '#16211b',
  },
  {
    name: 'ocean',
    label: 'Ocean',
    description: 'Cool sea-glass light mode with deep teal dark surfaces.',
    lightBackground: '#f5fbfb',
    lightSurface: '#e6f1f2',
    darkBackground: '#081214',
    darkSurface: '#102126',
  },
];

export interface ThemeState {
  mode: ModeName;
  primary: PrimaryName;
  primaryHex: string | null;
  palette: PaletteName;
  surfacePreset: SurfacePresetName | 'custom';
  lightBackground: string;
  lightSurface: string;
  darkBackground: string;
  darkSurface: string;
}

const DEFAULT_THEME: ThemeState = {
  mode: 'light',
  primary: 'slate',
  primaryHex: null,
  palette: 'default',
  surfacePreset: 'pure',
  lightBackground: '#ffffff',
  lightSurface: '#f8fafc',
  darkBackground: '#000000',
  darkSurface: '#0f172a',
};

const STORAGE_KEY = 'proto2.theme';
const DEFAULT_PRIMARY_HEX = '#0f172a';
const DARK_TEXT = '#0f172a';
const LIGHT_TEXT = '#f8fafc';

interface ThemeContextValue extends ThemeState {
  setMode: (next: ModeName) => void;
  setPrimary: (next: PrimaryName) => void;
  setPrimaryHex: (hex: string | null) => void;
  setPalette: (next: PaletteName) => void;
  setSurfaceToken: (token: SurfaceToken, value: string) => void;
  applySurfacePreset: (preset: SurfacePresetName) => void;
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
      surfacePreset:
        parsed.surfacePreset === 'pure' ||
        parsed.surfacePreset === 'slate' ||
        parsed.surfacePreset === 'cream' ||
        parsed.surfacePreset === 'ocean' ||
        parsed.surfacePreset === 'custom'
          ? parsed.surfacePreset
          : DEFAULT_THEME.surfacePreset,
      lightBackground: typeof parsed.lightBackground === 'string' ? parsed.lightBackground : DEFAULT_THEME.lightBackground,
      lightSurface: typeof parsed.lightSurface === 'string' ? parsed.lightSurface : DEFAULT_THEME.lightSurface,
      darkBackground: typeof parsed.darkBackground === 'string' ? parsed.darkBackground : DEFAULT_THEME.darkBackground,
      darkSurface: typeof parsed.darkSurface === 'string' ? parsed.darkSurface : DEFAULT_THEME.darkSurface,
    };
  } catch {
    return null;
  }
}

function softenHex(hex: string, alpha = 0.15): string {
  // Build an rgba "soft" backdrop from any hex.
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

function hexToRgb(hex: string): [number, number, number] {
  const normalized = normalizeHex(hex, '#000000').slice(1);
  return [
    parseInt(normalized.slice(0, 2), 16),
    parseInt(normalized.slice(2, 4), 16),
    parseInt(normalized.slice(4, 6), 16),
  ];
}

function rgbToHex([r, g, b]: [number, number, number]): string {
  return `#${[r, g, b].map((value) => Math.round(value).toString(16).padStart(2, '0')).join('')}`;
}

function mixHex(base: string, overlay: string, overlayAmount: number): string {
  const b = hexToRgb(base);
  const o = hexToRgb(overlay);
  const amount = Math.min(1, Math.max(0, overlayAmount));
  return rgbToHex([
    b[0] * (1 - amount) + o[0] * amount,
    b[1] * (1 - amount) + o[1] * amount,
    b[2] * (1 - amount) + o[2] * amount,
  ]);
}

function linearize(value: number): number {
  const channel = value / 255;
  return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

function contrastRatio(a: string, b: string): number {
  const lighter = Math.max(luminance(a), luminance(b));
  const darker = Math.min(luminance(a), luminance(b));
  return (lighter + 0.05) / (darker + 0.05);
}

function readableForeground(background: string): string {
  return contrastRatio(background, DARK_TEXT) >= contrastRatio(background, LIGHT_TEXT) ? DARK_TEXT : LIGHT_TEXT;
}

function mutedForeground(surface: string, foreground: string): string {
  for (const amount of [0.42, 0.36, 0.3, 0.24, 0.18, 0.12]) {
    const candidate = mixHex(foreground, surface, amount);
    if (contrastRatio(candidate, surface) >= 4.5) return candidate;
  }
  return foreground;
}

function primaryHexFor(state: ThemeState): string {
  if (state.primaryHex) return normalizeHex(state.primaryHex, DEFAULT_PRIMARY_HEX);
  return PRIMARY_PRESETS.find((preset) => preset.name === state.primary)?.hex ?? DEFAULT_PRIMARY_HEX;
}

function derivedSurfaceTokens(background: string, surface: string, primary: string, fallbackBackground: string, fallbackSurface: string) {
  const backgroundHex = normalizeHex(background, fallbackBackground);
  const surfaceHex = normalizeHex(surface, fallbackSurface);
  const foreground = readableForeground(backgroundHex);
  const cardForeground = readableForeground(surfaceHex);
  const darkSurface = luminance(surfaceHex) < 0.5;
  const accent = mixHex(surfaceHex, primary, darkSurface ? 0.16 : 0.12);

  return {
    background: backgroundHex,
    foreground,
    card: surfaceHex,
    cardForeground,
    popover: surfaceHex,
    popoverForeground: cardForeground,
    border: mixHex(surfaceHex, cardForeground, darkSurface ? 0.18 : 0.14),
    input: mixHex(surfaceHex, cardForeground, darkSurface ? 0.2 : 0.16),
    muted: mixHex(surfaceHex, backgroundHex, darkSurface ? 0.28 : 0.34),
    mutedForeground: mutedForeground(surfaceHex, cardForeground),
    accent,
    accentForeground: readableForeground(accent),
  };
}

function applyDerivedModeTokens(
  html: HTMLElement,
  mode: ModeName,
  background: string,
  surface: string,
  primary: string
) {
  const tokens = derivedSurfaceTokens(
    background,
    surface,
    primary,
    mode === 'dark' ? DEFAULT_THEME.darkBackground : DEFAULT_THEME.lightBackground,
    mode === 'dark' ? DEFAULT_THEME.darkSurface : DEFAULT_THEME.lightSurface
  );
  html.style.setProperty(`--${mode}-background`, tokens.background);
  html.style.setProperty(`--${mode}-foreground`, tokens.foreground);
  html.style.setProperty(`--${mode}-surface`, tokens.card);
  html.style.setProperty(`--${mode}-card-foreground`, tokens.cardForeground);
  html.style.setProperty(`--${mode}-popover`, tokens.popover);
  html.style.setProperty(`--${mode}-popover-foreground`, tokens.popoverForeground);
  html.style.setProperty(`--${mode}-border`, tokens.border);
  html.style.setProperty(`--${mode}-input`, tokens.input);
  html.style.setProperty(`--${mode}-muted`, tokens.muted);
  html.style.setProperty(`--${mode}-muted-foreground`, tokens.mutedForeground);
  html.style.setProperty(`--${mode}-accent`, tokens.accent);
  html.style.setProperty(`--${mode}-accent-foreground`, tokens.accentForeground);
}

function applyToDom(state: ThemeState) {
  if (typeof document === 'undefined') return;
  const html = document.documentElement;
  const primaryHex = primaryHexFor(state);
  html.classList.toggle('dark', state.mode === 'dark');
  html.setAttribute('data-primary', state.primary);
  html.setAttribute('data-palette', state.palette);
  html.setAttribute('data-surface-preset', state.surfacePreset);
  applyDerivedModeTokens(html, 'light', state.lightBackground, state.lightSurface, primaryHex);
  applyDerivedModeTokens(html, 'dark', state.darkBackground, state.darkSurface, primaryHex);

  // Custom hex wins over named preset.
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
  const setSurfaceToken = useCallback((token: SurfaceToken, value: string) => {
    setState((s) => ({ ...s, [token]: value, surfacePreset: 'custom' }));
  }, []);
  const applySurfacePreset = useCallback((preset: SurfacePresetName) => {
    const next = SURFACE_PRESETS.find((item) => item.name === preset);
    if (!next) return;
    setState((s) => ({
      ...s,
      surfacePreset: next.name,
      lightBackground: next.lightBackground,
      lightSurface: next.lightSurface,
      darkBackground: next.darkBackground,
      darkSurface: next.darkSurface,
    }));
  }, []);
  const reset = useCallback(() => setState(DEFAULT_THEME), []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      ...state,
      setMode,
      setPrimary,
      setPrimaryHex,
      setPalette,
      setSurfaceToken,
      applySurfacePreset,
      reset,
    }),
    [state, setMode, setPrimary, setPrimaryHex, setPalette, setSurfaceToken, applySurfacePreset, reset]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}

/**
 * First-paint script. Inlined as a string into <head> via Next's
 * dangerouslySetInnerHTML so the user never sees a flash of the default
 * theme on initial load.
 */
export const themeBootstrapScript = `
(function () {
  try {
    var darkText = '#0f172a';
    var lightText = '#f8fafc';
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
    function rgbToHex(rgb) {
      return '#' + rgb.map(function (value) {
        return Math.round(value).toString(16).padStart(2, '0');
      }).join('');
    }
    function mixHex(base, overlay, overlayAmount) {
      var b = hexToRgb(base);
      var o = hexToRgb(overlay);
      var amount = Math.min(1, Math.max(0, overlayAmount));
      return rgbToHex([
        b[0] * (1 - amount) + o[0] * amount,
        b[1] * (1 - amount) + o[1] * amount,
        b[2] * (1 - amount) + o[2] * amount
      ]);
    }
    function linearize(value) {
      var channel = value / 255;
      return channel <= 0.03928 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);
    }
    function luminance(hex) {
      var rgb = hexToRgb(hex);
      return 0.2126 * linearize(rgb[0]) + 0.7152 * linearize(rgb[1]) + 0.0722 * linearize(rgb[2]);
    }
    function contrastRatio(a, b) {
      var lighter = Math.max(luminance(a), luminance(b));
      var darker = Math.min(luminance(a), luminance(b));
      return (lighter + 0.05) / (darker + 0.05);
    }
    function readableForeground(background) {
      return contrastRatio(background, darkText) >= contrastRatio(background, lightText) ? darkText : lightText;
    }
    function mutedForeground(surface, foreground) {
      var amounts = [0.42, 0.36, 0.3, 0.24, 0.18, 0.12];
      for (var i = 0; i < amounts.length; i += 1) {
        var candidate = mixHex(foreground, surface, amounts[i]);
        if (contrastRatio(candidate, surface) >= 4.5) return candidate;
      }
      return foreground;
    }
    function derive(background, surface, primary, fallbackBackground, fallbackSurface) {
      var backgroundHex = normalizeHex(background, fallbackBackground);
      var surfaceHex = normalizeHex(surface, fallbackSurface);
      var foreground = readableForeground(backgroundHex);
      var cardForeground = readableForeground(surfaceHex);
      var darkSurface = luminance(surfaceHex) < 0.5;
      var accent = mixHex(surfaceHex, primary, darkSurface ? 0.16 : 0.12);
      return {
        background: backgroundHex,
        foreground: foreground,
        card: surfaceHex,
        cardForeground: cardForeground,
        popover: surfaceHex,
        popoverForeground: cardForeground,
        border: mixHex(surfaceHex, cardForeground, darkSurface ? 0.18 : 0.14),
        input: mixHex(surfaceHex, cardForeground, darkSurface ? 0.2 : 0.16),
        muted: mixHex(surfaceHex, backgroundHex, darkSurface ? 0.28 : 0.34),
        mutedForeground: mutedForeground(surfaceHex, cardForeground),
        accent: accent,
        accentForeground: readableForeground(accent)
      };
    }
    function setModeTokens(html, mode, background, surface, primary, fallbackBackground, fallbackSurface) {
      var tokens = derive(background, surface, primary, fallbackBackground, fallbackSurface);
      html.style.setProperty('--' + mode + '-background', tokens.background);
      html.style.setProperty('--' + mode + '-foreground', tokens.foreground);
      html.style.setProperty('--' + mode + '-surface', tokens.card);
      html.style.setProperty('--' + mode + '-card-foreground', tokens.cardForeground);
      html.style.setProperty('--' + mode + '-popover', tokens.popover);
      html.style.setProperty('--' + mode + '-popover-foreground', tokens.popoverForeground);
      html.style.setProperty('--' + mode + '-border', tokens.border);
      html.style.setProperty('--' + mode + '-input', tokens.input);
      html.style.setProperty('--' + mode + '-muted', tokens.muted);
      html.style.setProperty('--' + mode + '-muted-foreground', tokens.mutedForeground);
      html.style.setProperty('--' + mode + '-accent', tokens.accent);
      html.style.setProperty('--' + mode + '-accent-foreground', tokens.accentForeground);
    }
    function primaryHexFor(t) {
      var presets = {
        violet: '#7c3aed',
        indigo: '#4f46e5',
        blue: '#2563eb',
        cyan: '#0891b2',
        emerald: '#059669',
        amber: '#d97706',
        rose: '#e11d48',
        slate: '#0f172a'
      };
      return t.primaryHex ? normalizeHex(t.primaryHex, '${DEFAULT_PRIMARY_HEX}') : (presets[t.primary] || '${DEFAULT_PRIMARY_HEX}');
    }
    function softenHex(hex, alpha) {
      var rgb = hexToRgb(hex);
      return 'rgba(' + rgb[0] + ', ' + rgb[1] + ', ' + rgb[2] + ', ' + alpha + ')';
    }
    var raw = localStorage.getItem('${STORAGE_KEY}');
    if (!raw) return;
    var t = JSON.parse(raw);
    var html = document.documentElement;
    var primary = primaryHexFor(t);
    html.classList.toggle('dark', t.mode === 'dark');
    if (t.primary) html.setAttribute('data-primary', t.primary);
    if (t.palette) html.setAttribute('data-palette', t.palette);
    if (t.surfacePreset) html.setAttribute('data-surface-preset', t.surfacePreset);
    setModeTokens(html, 'light', t.lightBackground || '${DEFAULT_THEME.lightBackground}', t.lightSurface || '${DEFAULT_THEME.lightSurface}', primary, '${DEFAULT_THEME.lightBackground}', '${DEFAULT_THEME.lightSurface}');
    setModeTokens(html, 'dark', t.darkBackground || '${DEFAULT_THEME.darkBackground}', t.darkSurface || '${DEFAULT_THEME.darkSurface}', primary, '${DEFAULT_THEME.darkBackground}', '${DEFAULT_THEME.darkSurface}');
    if (t.primaryHex) {
      html.style.setProperty('--primary', primary);
      html.style.setProperty('--primary-soft', softenHex(primary, 0.18));
      html.style.setProperty('--ring', primary);
    }
  } catch (_) {}
})();
`.trim();