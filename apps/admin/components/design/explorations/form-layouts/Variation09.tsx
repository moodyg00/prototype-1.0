import { ChevronDown, ChevronRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { SelectButton } from '@/components/ui/select';

// @mock-start
// @mock-end

export interface FormLayoutProgressiveProps {}

export function FormLayoutProgressive(_props: FormLayoutProgressiveProps = {}) {
  return (
    <div className="px-6 py-8" style={{ background: 'var(--background)' }}>
      <div className="mx-auto max-w-2xl space-y-4">
        <div className="space-y-1">
          <h2 className="font-semibold text-xl tracking-tight">Create automation</h2>
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
            Start simple. Reveal advanced sections only when you need them.
          </p>
        </div>

        <div
          className="overflow-hidden rounded-xl border"
          style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
        >
          <div
            className="flex items-center justify-between gap-3 border-b px-5 py-3"
            style={{ borderColor: 'var(--border)' }}
          >
            <div className="flex items-center gap-2">
              <ChevronDown className="size-4" style={{ color: 'var(--muted-foreground)' }} />
              <div className="font-medium text-sm">Basics</div>
            </div>
            <span className="text-[10px] uppercase tracking-[0.18em]" style={{ color: 'var(--muted-foreground)' }}>
              Required
            </span>
          </div>
          <div className="space-y-4 px-5 py-5">
            <Field>
              <FieldLabel>Automation name</FieldLabel>
              <Input placeholder="e.g. Auto-tag overdue invoices" />
            </Field>
            <Field>
              <FieldLabel>Trigger</FieldLabel>
              <SelectButton>Invoice goes overdue</SelectButton>
              <FieldDescription>
                The event that starts the automation.
              </FieldDescription>
            </Field>
          </div>
        </div>

        <div
          className="overflow-hidden rounded-xl border"
          style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
        >
          <div
            className="flex items-center justify-between gap-3 px-5 py-3"
            style={{ borderColor: 'var(--border)' }}
          >
            <div className="flex items-center gap-2">
              <ChevronRight className="size-4" style={{ color: 'var(--muted-foreground)' }} />
              <div className="font-medium text-sm">Conditions</div>
            </div>
            <button
              type="button"
              className="text-xs"
              style={{ color: 'var(--muted-foreground)' }}
            >
              Show
            </button>
          </div>
        </div>

        <div
          className="overflow-hidden rounded-xl border"
          style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
        >
          <div
            className="flex items-center justify-between gap-3 px-5 py-3"
            style={{ borderColor: 'var(--border)' }}
          >
            <div className="flex items-center gap-2">
              <ChevronRight className="size-4" style={{ color: 'var(--muted-foreground)' }} />
              <div className="font-medium text-sm">Actions</div>
            </div>
            <button
              type="button"
              className="text-xs"
              style={{ color: 'var(--muted-foreground)' }}
            >
              Show
            </button>
          </div>
        </div>

        <div
          className="overflow-hidden rounded-xl border"
          style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
        >
          <div
            className="flex items-center justify-between gap-3 px-5 py-3"
            style={{ borderColor: 'var(--border)' }}
          >
            <div className="flex items-center gap-2">
              <ChevronRight className="size-4" style={{ color: 'var(--muted-foreground)' }} />
              <div className="font-medium text-sm">Advanced</div>
              <span
                className="rounded-full px-1.5 py-0.5 text-[10px]"
                style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}
              >
                Optional
              </span>
            </div>
            <button
              type="button"
              className="text-xs"
              style={{ color: 'var(--muted-foreground)' }}
            >
              Show
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 pt-2">
          <Button variant="ghost" size="sm" className="gap-1.5">
            <Plus className="size-3.5" />
            Add custom step
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              Cancel
            </Button>
            <Button size="sm">Create automation</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
