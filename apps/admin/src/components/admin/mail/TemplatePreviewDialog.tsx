'use client';

import * as React from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
} from '@/components/ui/dialog';

import { humanize, statusBadgeVariant, type MailTemplate } from './types';

export interface TemplatePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: MailTemplate | null;
}

export function TemplatePreviewDialog({
  open,
  onOpenChange,
  template,
}: TemplatePreviewDialogProps): React.ReactElement | null {
  if (!template) return null;

  const hasHtml = Boolean(template.bodyHtml && template.bodyHtml.trim().length > 0);
  const hasText = Boolean(template.bodyText && template.bodyText.trim().length > 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{template.name}</DialogTitle>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Badge variant="outline">{humanize(template.category)}</Badge>
            <Badge variant={statusBadgeVariant(template.status)}>{humanize(template.status)}</Badge>
          </div>
        </DialogHeader>

        <DialogPanel className="space-y-4">
          <div className="space-y-1">
            <div className="text-[10px] font-medium uppercase tracking-[0.18em]" style={{ color: 'var(--muted-foreground)' }}>
              Subject
            </div>
            <div className="text-sm font-medium">{template.subject}</div>
            {template.preheader ? (
              <div className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                {template.preheader}
              </div>
            ) : null}
          </div>

          <div className="space-y-1">
            <div className="text-[10px] font-medium uppercase tracking-[0.18em]" style={{ color: 'var(--muted-foreground)' }}>
              Body
            </div>
            {hasHtml ? (
              // Rendered in a sandboxed iframe so template markup/styles can't
              // touch the admin app and inline scripts can't run.
              <iframe
                title={`Preview of ${template.name}`}
                sandbox=""
                srcDoc={template.bodyHtml ?? ''}
                className="h-80 w-full rounded-lg border"
                style={{ borderColor: 'var(--border)', background: '#ffffff' }}
              />
            ) : hasText ? (
              <pre
                className="max-h-80 overflow-auto rounded-lg border p-4 text-sm whitespace-pre-wrap"
                style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
              >
                {template.bodyText}
              </pre>
            ) : (
              <div
                className="rounded-lg border px-4 py-8 text-center text-sm"
                style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}
              >
                This template has no body content yet.
              </div>
            )}
          </div>

          {template.footerText ? (
            <div className="space-y-1">
              <div className="text-[10px] font-medium uppercase tracking-[0.18em]" style={{ color: 'var(--muted-foreground)' }}>
                Footer
              </div>
              <div className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                {template.footerText}
              </div>
            </div>
          ) : null}
        </DialogPanel>

        <DialogFooter>
          <DialogClose render={<Button variant="outline" type="button" />}>Close</DialogClose>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
