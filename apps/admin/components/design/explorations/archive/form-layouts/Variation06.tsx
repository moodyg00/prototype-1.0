import { Check, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { SelectButton } from '@/components/ui/select';

type WizardStep = { label: string; done?: boolean; active?: boolean };

// @mock-start
const MOCK_STEPS: WizardStep[] = [
  { label: 'Identity', done: true },
  { label: 'Address', active: true },
  { label: 'Review' },
];
// @mock-end

export interface FormLayoutWizardProps {
  steps?: ReadonlyArray<WizardStep>;
}

export function FormLayoutWizard({
  steps = MOCK_STEPS,
}: FormLayoutWizardProps = {}) {
  return (
    <div className="px-6 py-8" style={{ background: 'var(--background)' }}>
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="space-y-1">
          <div className="text-[11px] font-mono uppercase tracking-[0.22em]" style={{ color: 'var(--muted-foreground)' }}>
            Step 2 of 3
          </div>
          <h2 className="font-semibold text-xl tracking-tight">Where should we ship to?</h2>
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
            We use this address for billing receipts and shipped collateral.
          </p>
        </div>

        <ol
          className="flex items-center gap-2 rounded-full border p-1"
          style={{
            background: 'var(--card)',
            borderColor: 'var(--border)',
          }}
        >
          {steps.map((step, idx) => (
            <li
              key={step.label}
              className="flex flex-1 items-center gap-2 rounded-full px-3 py-1.5 text-xs"
              style={{
                background: step.active
                  ? 'var(--primary-soft)'
                  : step.done
                    ? 'transparent'
                    : 'transparent',
                color: step.active
                  ? 'var(--primary)'
                  : step.done
                    ? 'var(--foreground)'
                    : 'var(--muted-foreground)',
                fontWeight: step.active ? 600 : 500,
              }}
            >
              <span
                className="grid size-5 place-items-center rounded-full text-[11px]"
                style={{
                  background: step.done
                    ? 'var(--primary)'
                    : step.active
                      ? 'var(--primary)'
                      : 'var(--muted)',
                  color: step.done || step.active ? 'white' : 'var(--muted-foreground)',
                }}
              >
                {step.done ? <Check className="size-3" /> : idx + 1}
              </span>
              <span>{step.label}</span>
            </li>
          ))}
        </ol>

        <div className="space-y-4">
          <Field>
            <FieldLabel>Street address</FieldLabel>
            <Input placeholder="142 Mission St" />
          </Field>
          <div className="grid grid-cols-3 gap-3">
            <Field className="col-span-2">
              <FieldLabel>City</FieldLabel>
              <Input placeholder="San Francisco" />
            </Field>
            <Field>
              <FieldLabel>ZIP</FieldLabel>
              <Input placeholder="94105" />
            </Field>
          </div>
          <Field>
            <FieldLabel>Country</FieldLabel>
            <SelectButton>United States</SelectButton>
            <FieldDescription>
              Affects available payment methods and tax handling.
            </FieldDescription>
          </Field>
        </div>

        <div
          className="flex items-center justify-between border-t pt-4"
          style={{ borderColor: 'var(--border)' }}
        >
          <Button variant="ghost" size="sm">
            Back
          </Button>
          <Button size="sm" className="gap-1.5">
            Continue
            <ArrowRight className="size-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
