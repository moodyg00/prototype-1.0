/**
 * Design Mode context — the shared subset needed by the IDE agent. The full
 * browser-side bridge contract lives in the public-dev app; this module only
 * carries what the agent needs to understand a visual selection and render it
 * into a prompt block.
 */

/** A single element the user selected in the preview. */
export interface ElementContext {
  cssSelector: string;
  xpath: string;
  tagName: string;
  id: string;
  classList: string[];
  attributes: Record<string, string>;
  outerHTML: string;
  innerText: string;
  computedStyles: Record<string, string>;
  rect: { x: number; y: number; w: number; h: number };
}

/** Optional area the user boxed with shift-drag (normalized 0-1 of viewport). */
export interface DesignAnnotation {
  kind: 'area';
  rect: { x: number; y: number; w: number; h: number };
}

/** Payload attached to an agent request when Design Mode drives the edit. */
export interface DesignContext {
  pagePath: string;
  selections: ElementContext[];
  annotation?: DesignAnnotation;
  viewport?: { w: number; h: number };
  screenshotDataUrl?: string;
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
