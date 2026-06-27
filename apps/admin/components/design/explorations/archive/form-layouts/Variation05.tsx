import { Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';

// @mock-start
// @mock-end

export interface FormLayoutCompactCardProps {}

export function FormLayoutCompactCard(_props: FormLayoutCompactCardProps = {}) {
  return (
    <div
      className="grid place-items-center px-6 py-12"
      style={{
        background:
          'radial-gradient(circle at top, color-mix(in srgb, var(--primary-soft) 60%, var(--background)) 0%, var(--background) 60%)',
      }}
    >
      <div
        className="w-full max-w-sm space-y-6 rounded-2xl border p-6 shadow-md"
        style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
      >
        <div className="space-y-2 text-center">
          <div
            className="mx-auto grid size-10 place-items-center rounded-xl"
            style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}
          >
            <Mail className="size-4.5" />
          </div>
          <h2 className="font-semibold text-lg tracking-tight">Sign in to Proto-2</h2>
          <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
            Use your work email. We&rsquo;ll send a one-time code.
          </p>
        </div>

        <div className="space-y-3">
          <Field>
            <FieldLabel className="sr-only">Work email</FieldLabel>
            <Input type="email" placeholder="you@company.com" />
          </Field>

          <Button size="default" className="h-9 w-full">
            Continue
          </Button>

          <div className="flex items-center gap-3">
            <span className="h-px flex-1" style={{ background: 'var(--border)' }} />
            <span className="text-[11px] uppercase tracking-[0.18em]" style={{ color: 'var(--muted-foreground)' }}>
              or
            </span>
            <span className="h-px flex-1" style={{ background: 'var(--border)' }} />
          </div>

          <Button variant="outline" size="default" className="h-9 w-full">
            Continue with SSO
          </Button>
        </div>

        <label className="flex items-start gap-2 text-xs" style={{ color: 'var(--muted-foreground)' }}>
          <Checkbox defaultChecked />
          <span>Keep me signed in on this device for 30 days.</span>
        </label>
      </div>
    </div>
  );
}
