import { X, ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';

// @mock-start
// @mock-end

export interface DialogWizardProps {}

export function DialogWizard(_props: DialogWizardProps = {}) {
  return (
    <div
      className="relative grid place-items-center px-6 py-10"
      style={{
        background: 'color-mix(in srgb, var(--foreground) 14%, var(--background))',
      }}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-xl border shadow-xl"
        style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
      >
        <div
          className="flex items-center justify-between gap-4 border-b px-6 py-4"
          style={{ borderColor: 'var(--border)' }}
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span
                className="grid size-6 place-items-center rounded-full text-[11px] text-white"
                style={{ background: 'var(--primary)' }}
              >
                <Check className="size-3" />
              </span>
              <span className="h-px w-5" style={{ background: 'var(--border)' }} />
              <span
                className="grid size-6 place-items-center rounded-full font-semibold text-[11px] text-white"
                style={{ background: 'var(--primary)' }}
              >
                2
              </span>
            </div>
            <div>
              <div className="font-semibold text-sm tracking-tight">Create opportunity</div>
              <div className="text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
                Step 2 of 2 &middot; Pricing
              </div>
            </div>
          </div>
          <button
            type="button"
            className="rounded-md p-1 transition-colors hover:bg-[var(--muted)]"
            aria-label="Close"
          >
            <X className="size-4" style={{ color: 'var(--muted-foreground)' }} />
          </button>
        </div>

        <div className="space-y-4 px-6 py-5">
          <Field>
            <FieldLabel>Estimated value</FieldLabel>
            <Input placeholder="$0.00" defaultValue="12,500" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field>
              <FieldLabel>Probability</FieldLabel>
              <Input placeholder="50%" defaultValue="65%" />
            </Field>
            <Field>
              <FieldLabel>Close date</FieldLabel>
              <Input placeholder="MM / DD / YYYY" defaultValue="06 / 14 / 2026" />
            </Field>
          </div>
          <div
            className="rounded-lg border p-3 text-xs"
            style={{
              background: 'var(--primary-soft)',
              borderColor: 'color-mix(in srgb, var(--primary) 22%, var(--border))',
              color: 'var(--foreground)',
            }}
          >
            <div className="font-medium">From step 1</div>
            <div style={{ color: 'var(--muted-foreground)' }}>
              Acme Co. &middot; Annual subscription &middot; Owner: Avery R.
            </div>
          </div>
        </div>

        <div
          className="flex items-center justify-between gap-2 border-t px-6 py-3"
          style={{ borderColor: 'var(--border)' }}
        >
          <Button variant="ghost" size="sm">
            Back
          </Button>
          <Button size="sm" className="gap-1.5">
            Create opportunity
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
