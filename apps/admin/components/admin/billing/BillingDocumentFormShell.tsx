'use client';

import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTab, TabsPanel } from '@/components/ui/tabs';
import { cn } from '@/src/lib/utils';

export interface BillingDocumentFormShellProps {
  /** Distinguishes the create flow from the edit-mode detail page. */
  mode?: 'create' | 'edit';
  /** Document kind, used by the shell for analytics-style attributes. */
  kind?: 'invoice' | 'estimate';
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  backHref?: string;
  backLabel?: string;
  /** Optional badge rendered next to the title (e.g. status). */
  statusBadge?: React.ReactNode;
  /** Buttons rendered in the header bar (Save, Cancel, etc.). */
  actions?: React.ReactNode;
  /** Alias for `actions` — kept for backwards compatibility. */
  headerActions?: React.ReactNode;
  /** Editor pane content (left column on desktop, "Edit" tab on mobile). */
  editor: React.ReactNode;
  /** Preview pane content (right column on desktop, "Preview" tab on mobile). */
  preview: React.ReactNode;
  /** Sticky footer rendered below both panes (totals + primary actions). */
  footer?: React.ReactNode;
  /** Optional banner above the form (e.g. status warnings on edit pages). */
  banner?: React.ReactNode;
  className?: string;
}

/**
 * Shared two-pane shell used by the invoice and estimate create/edit flows.
 *
 * Desktop: editor on the left (~1.6fr), live preview on the right (1fr) with
 * a sticky offset so the preview stays visible while the editor scrolls.
 *
 * Mobile / sm: a `Tabs` switch between "Edit" and "Preview" — the panes
 * share vertical space so neither requires an awkward scroll-jail.
 *
 * The footer sticks to the viewport bottom only while the shell is on
 * screen (form + preview). It spans the shell width, not the full main
 * column, and scrolls away before sibling content below the shell (e.g.
 * estimate materials).
 */
export function BillingDocumentFormShell({
  mode = 'create',
  kind,
  eyebrow,
  title,
  subtitle,
  backHref,
  backLabel = 'Back',
  statusBadge,
  actions,
  headerActions,
  editor,
  preview,
  footer,
  banner,
  className,
}: BillingDocumentFormShellProps): React.ReactElement {
  const headerActionsNode = actions ?? headerActions;
  return (
    <div
      className={cn('flex min-h-full flex-col gap-6', className)}
      data-billing-shell-mode={mode}
      data-billing-shell-kind={kind}
    >
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          {backHref ? (
            <Link
              href={backHref}
              className="inline-flex items-center gap-1 text-xs uppercase tracking-[0.18em] text-[var(--muted-foreground)] hover:text-foreground"
            >
              <ChevronLeft aria-hidden className="size-3.5" />
              {backLabel}
            </Link>
          ) : null}
          {eyebrow ? (
            <div
              className="text-[11px] font-mono uppercase tracking-[0.22em]"
              style={{ color: 'var(--muted-foreground)' }}
            >
              {eyebrow}
            </div>
          ) : null}
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            {statusBadge}
          </div>
          {subtitle ? (
            <p className="max-w-2xl text-sm" style={{ color: 'var(--muted-foreground)' }}>
              {subtitle}
            </p>
          ) : null}
        </div>
        {headerActionsNode ? (
          <div className="flex flex-wrap items-center gap-2">{headerActionsNode}</div>
        ) : null}
      </header>

      {banner ? <div>{banner}</div> : null}

      {/* Mobile / small screens: tabbed pane to keep the layout tight. */}
      <div className="lg:hidden">
        <Tabs defaultValue="edit" className="gap-3">
          <TabsList className="w-full">
            <TabsTab value="edit" className="flex-1">
              Edit
            </TabsTab>
            <TabsTab value="preview" className="flex-1">
              Preview
            </TabsTab>
          </TabsList>
          <TabsPanel value="edit" className="space-y-6">
            {editor}
          </TabsPanel>
          <TabsPanel value="preview" className="space-y-6">
            {preview}
          </TabsPanel>
        </Tabs>
      </div>

      {/* Desktop: split layout with sticky preview. */}
      <div className="hidden gap-6 lg:grid lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <section className="space-y-6">{editor}</section>
        <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">{preview}</aside>
      </div>

      {footer ? (
        <div className="sticky bottom-0 z-10 pt-2">
          <div
            className="w-full rounded-2xl border bg-[var(--card)] px-4 py-3 shadow-lg"
            style={{ borderColor: 'var(--border)' }}
          >
            {footer}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export interface BillingFooterButtonsProps {
  primaryLabel?: string;
  primaryDisabled?: boolean;
  primaryLoading?: boolean;
  onPrimary?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  /** Total summary node rendered on the left of the footer. */
  summary?: React.ReactNode;
  /** Optional kbd hint chip rendered next to the primary button. */
  kbdHint?: React.ReactNode;
}

/**
 * Convenience footer composer for the BillingDocumentFormShell. Layouts the
 * total-summary on the left and the action buttons on the right.
 */
export function BillingFooterButtons({
  primaryLabel = 'Save draft',
  primaryDisabled,
  primaryLoading,
  onPrimary,
  secondaryLabel,
  onSecondary,
  summary,
  kbdHint,
}: BillingFooterButtonsProps): React.ReactElement {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="min-w-0 flex-1">{summary}</div>
      <div className="flex items-center gap-2">
        {secondaryLabel ? (
          <Button type="button" variant="ghost" size="sm" onClick={onSecondary}>
            {secondaryLabel}
          </Button>
        ) : null}
        <Button
          type="button"
          size="sm"
          onClick={onPrimary}
          disabled={primaryDisabled || primaryLoading}
        >
          {primaryLoading ? 'Saving…' : primaryLabel}
          {kbdHint ? <span className="ml-2 inline-flex items-center">{kbdHint}</span> : null}
        </Button>
      </div>
    </div>
  );
}
