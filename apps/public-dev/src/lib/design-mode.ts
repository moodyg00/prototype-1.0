/**
 * Design Mode — shared types + helpers.
 *
 * Design Mode is a Cursor-style visual editing layer over the preview iframe:
 * the user toggles it on, clicks (or multi-selects / area-selects) elements in
 * the running static site, and the captured DOM context is attached to the agent
 * request so it can edit the right source files. This module is the contract
 * shared by the in-iframe bridge (public/design-mode.js), the overlay UI, and
 * the agent API route.
 */

/** A single element the user selected in the preview. Built in design-mode.js. */
export interface ElementContext {
  /** Stable-ish unique CSS selector for the element. */
  cssSelector: string;
  /** XPath as a secondary locator. */
  xpath: string;
  tagName: string;
  id: string;
  classList: string[];
  /** Small set of meaningful attributes (href, src, alt, role, type, name, etc.). */
  attributes: Record<string, string>;
  /** Truncated outerHTML of the element (selected node, optionally trimmed). */
  outerHTML: string;
  /** Truncated visible text. */
  innerText: string;
  /** Subset of computed styles relevant to layout/typography. */
  computedStyles: Record<string, string>;
  /** Viewport-relative bounding box. */
  rect: { x: number; y: number; w: number; h: number };
}

/** Optional area the user boxed with shift-drag (normalized 0-1 of viewport). */
export interface DesignAnnotation {
  kind: 'area';
  rect: { x: number; y: number; w: number; h: number };
}

/** Payload attached to an agent request when Design Mode drives the edit. */
export interface DesignContext {
  /** Project-relative HTML page the selection came from, e.g. "about.html". */
  pagePath: string;
  selections: ElementContext[];
  annotation?: DesignAnnotation;
  viewport?: { w: number; h: number };
  /**
   * PNG data URL of the preview viewport at submit time, with any freehand
   * draw annotations baked in. Best-effort — may be omitted if capture fails.
   */
  screenshotDataUrl?: string;
}

/** Messages exchanged between the preview iframe and the parent overlay. */
export type DesignBridgeMessage =
  | { type: 'design:ready' }
  | { type: 'design:selection'; selections: ElementContext[]; pagePath: string; viewport: { w: number; h: number } }
  | { type: 'design:annotation'; annotation: DesignAnnotation }
  | { type: 'design:cleared' };

export type DesignParentMessage =
  | { type: 'design:enable' }
  | { type: 'design:disable' }
  | { type: 'design:clear' };

/**
 * Map a preview URL/pathname to the project-relative source file.
 * e.g. "/preview/home-services/about.html" -> "about.html"
 *      "/preview/home-services/" -> "index.html"
 */
export function previewPathToProjectPath(slug: string, pathname: string): string {
  const prefix = `/preview/${slug}/`;
  let rel = pathname.startsWith(prefix) ? pathname.slice(prefix.length) : pathname.replace(/^\/+/, '');
  rel = rel.split('?')[0].split('#')[0];
  if (!rel || rel.endsWith('/')) rel += 'index.html';
  return rel;
}

const MAX_HTML = 2000;
const MAX_TEXT = 300;

/** Build a compact, agent-friendly description of the design selection. */
export function buildDesignPromptBlock(ctx: DesignContext): string {
  const lines: string[] = [];
  lines.push(`# Visual selection (Design Mode)`);
  lines.push(`Page: ${ctx.pagePath}`);
  if (ctx.viewport) lines.push(`Viewport: ${ctx.viewport.w}x${ctx.viewport.h}`);
  if (ctx.annotation) {
    const r = ctx.annotation.rect;
    lines.push(
      `Annotated area (normalized): x=${r.x.toFixed(2)} y=${r.y.toFixed(2)} w=${r.w.toFixed(2)} h=${r.h.toFixed(2)}`,
    );
  }
  if (ctx.screenshotDataUrl) {
    lines.push(
      `A screenshot of the selection is attached as an image; any red marks on it are the user's drawn annotations highlighting what to change.`,
    );
  }
  lines.push(`Selected ${ctx.selections.length} element(s):`);

  ctx.selections.forEach((el, i) => {
    lines.push(`\n[Element ${i + 1}]`);
    lines.push(`selector: ${el.cssSelector}`);
    if (el.id) lines.push(`id: ${el.id}`);
    if (el.classList.length) lines.push(`classes: ${el.classList.join(' ')}`);
    const devSource = el.attributes['data-dev-source'];
    if (devSource) lines.push(`source (file:line): ${devSource}`);
    const attrKeys = Object.keys(el.attributes).filter((k) => k !== 'data-dev-source');
    if (attrKeys.length) {
      lines.push(`attributes: ${attrKeys.map((k) => `${k}="${el.attributes[k]}"`).join(' ')}`);
    }
    const styleKeys = Object.keys(el.computedStyles);
    if (styleKeys.length) {
      lines.push(`styles: ${styleKeys.map((k) => `${k}: ${el.computedStyles[k]}`).join('; ')}`);
    }
    if (el.innerText) lines.push(`text: ${el.innerText.slice(0, MAX_TEXT)}`);
    lines.push(`html: ${el.outerHTML.slice(0, MAX_HTML)}`);
  });

  return lines.join('\n');
}

/** Truncation limits exported so the bridge script and server agree. */
export const DESIGN_LIMITS = { MAX_HTML, MAX_TEXT };
