import { X, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { SelectButton } from '@/components/ui/select';

// @mock-start
// @mock-end

export interface DialogFormGridProps {}

export function DialogFormGrid(_props: DialogFormGridProps = {}) {
  return (
    <div
      className="relative grid place-items-center px-6 py-10"
      style={{
        background: 'color-mix(in srgb, var(--foreground) 14%, var(--background))',
      }}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-xl border shadow-xl"
        style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
      >
        <div
          className="flex items-start justify-between gap-4 border-b px-6 py-4"
          style={{ borderColor: 'var(--border)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="grid size-9 place-items-center rounded-lg"
              style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}
            >
              <UserPlus className="size-4.5" />
            </div>
            <div>
              <h3 className="font-semibold text-base tracking-tight">Invite teammate</h3>
              <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                They&rsquo;ll receive an email with a sign-up link.
              </p>
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

        <div className="grid grid-cols-2 gap-4 px-6 py-5">
          <Field>
            <FieldLabel>First name</FieldLabel>
            <Input placeholder="Avery" />
          </Field>
          <Field>
            <FieldLabel>Last name</FieldLabel>
            <Input placeholder="Reyes" />
          </Field>
          <Field className="col-span-2">
            <FieldLabel>Work email</FieldLabel>
            <Input type="email" placeholder="avery@acme.co" />
            <FieldDescription>We&rsquo;ll only use this for sign-in and notifications.</FieldDescription>
          </Field>
          <Field className="col-span-2">
            <FieldLabel>Role</FieldLabel>
            <SelectButton>Member &mdash; can edit assigned work</SelectButton>
          </Field>
        </div>

        <div
          className="flex items-center justify-between gap-2 border-t px-6 py-3"
          style={{ borderColor: 'var(--border)' }}
        >
          <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
            2 of 5 seats used
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              Cancel
            </Button>
            <Button size="sm">Send invite</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
