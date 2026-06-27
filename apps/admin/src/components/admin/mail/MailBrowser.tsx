'use client';

import * as React from 'react';
import { Mail, Pencil, Search, Send, Eye } from 'lucide-react';

import { AdminPageHeader } from '@/src/components/admin/AdminPageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty';
import { Input } from '@/components/ui/input';

import { SendDialog } from './SendDialog';
import { TemplateFormDialog } from './TemplateFormDialog';
import { TemplatePreviewDialog } from './TemplatePreviewDialog';
import { formatUpdatedAt, humanize, statusBadgeVariant, type MailTemplate } from './types';

function matchTemplate(template: MailTemplate, query: string): boolean {
  const haystack = [template.name, template.subject, template.category, template.status]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return haystack.includes(query.toLowerCase());
}

export function MailBrowser(): React.ReactElement {
  const [templates, setTemplates] = React.useState<MailTemplate[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [query, setQuery] = React.useState('');

  const [formOpen, setFormOpen] = React.useState(false);
  const [editingTemplate, setEditingTemplate] = React.useState<MailTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = React.useState<MailTemplate | null>(null);
  const [previewOpen, setPreviewOpen] = React.useState(false);
  const [sendTemplate, setSendTemplate] = React.useState<MailTemplate | null>(null);
  const [sendOpen, setSendOpen] = React.useState(false);

  const loadTemplates = React.useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch('/api/admin/email-templates', { cache: 'no-store' });
      const body = (await res.json()) as { templates?: MailTemplate[]; error?: string };
      if (!res.ok) throw new Error(body.error ?? 'Unable to load templates.');
      setTemplates(Array.isArray(body.templates) ? body.templates : []);
    } catch (error) {
      setTemplates([]);
      setLoadError(error instanceof Error ? error.message : 'Unable to load templates.');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadTemplates();
  }, [loadTemplates]);

  const filtered = React.useMemo(() => {
    const trimmed = query.trim();
    if (trimmed.length === 0) return templates;
    return templates.filter((template) => matchTemplate(template, trimmed));
  }, [templates, query]);

  const handleNew = () => {
    setEditingTemplate(null);
    setFormOpen(true);
  };

  const handleEdit = (template: MailTemplate) => {
    setEditingTemplate(template);
    setFormOpen(true);
  };

  const handlePreview = (template: MailTemplate) => {
    setPreviewTemplate(template);
    setPreviewOpen(true);
  };

  const handleSend = (template: MailTemplate) => {
    setSendTemplate(template);
    setSendOpen(true);
  };

  const handleSaved = (saved: MailTemplate) => {
    setTemplates((prev) => {
      const exists = prev.some((item) => item.id === saved.id);
      if (exists) {
        return prev.map((item) => (item.id === saved.id ? saved : item));
      }
      return [saved, ...prev];
    });
  };

  return (
    <div className="space-y-6 pb-6 admin-stagger">
      <AdminPageHeader
        eyebrow="Customer Relations"
        title="Mail"
        description="Email templates for outbound communication and customer follow-up."
        meta={
          <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            {filtered.length} visible
          </span>
        }
      />

      <div className="grid gap-3 border-b border-border/40 pb-4 sm:grid-cols-[1fr_auto]">
        <label className="space-y-1.5">
          <span className="admin-meta-label">Search</span>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
              style={{ color: 'var(--muted-foreground)' }}
            />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search templates by name, subject, or category"
              className="pl-10"
              type="search"
            />
          </div>
        </label>
        <div className="flex items-end">
          <Button onClick={handleNew}>
            <Mail />
            New Template
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-sm text-muted-foreground">Loading templates…</div>
      ) : loadError ? (
        <div className="py-16 text-center text-sm text-muted-foreground">{loadError}</div>
      ) : filtered.length === 0 ? (
        <Empty className="py-14">
          <EmptyHeader>
            <EmptyTitle>No templates</EmptyTitle>
            <EmptyDescription>
              {templates.length === 0
                ? 'Create your first email template to get started.'
                : 'No templates match this search.'}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((template) => (
            <article key={template.id} className="admin-surface flex flex-col p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <div className="truncate text-[15px] font-semibold leading-tight">{template.name}</div>
                  <div className="truncate text-sm leading-6" style={{ color: 'var(--muted-foreground)' }}>
                    {template.subject}
                  </div>
                </div>
                <Badge variant={statusBadgeVariant(template.status)}>{humanize(template.status)}</Badge>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Badge variant="outline">{humanize(template.category)}</Badge>
                <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                  Updated {formatUpdatedAt(template.updatedAt)}
                </span>
              </div>

              <div className="mt-4 flex items-center gap-2 border-t border-border/35 pt-3">
                <Button variant="outline" size="sm" onClick={() => handleEdit(template)}>
                  <Pencil />
                  Edit
                </Button>
                <Button variant="outline" size="sm" onClick={() => handlePreview(template)}>
                  <Eye />
                  Preview
                </Button>
                <Button size="sm" className="ml-auto" onClick={() => handleSend(template)}>
                  <Send />
                  Send
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}

      <TemplateFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        template={editingTemplate}
        onSaved={handleSaved}
      />
      <TemplatePreviewDialog open={previewOpen} onOpenChange={setPreviewOpen} template={previewTemplate} />
      <SendDialog open={sendOpen} onOpenChange={setSendOpen} template={sendTemplate} />
    </div>
  );
}
