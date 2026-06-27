import { Button } from '@/components/ui/button';
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { SelectButton } from '@/components/ui/select';

// @mock-start
// @mock-end

export interface FormLayoutModalShapeProps {}

export function FormLayoutModalShape(_props: FormLayoutModalShapeProps = {}) {
  return (
    <div className="px-6 py-10" style={{ background: 'var(--background)' }}>
      <div className="mx-auto w-full max-w-md space-y-5">
        <div className="space-y-1">
          <h2 className="font-semibold text-xl tracking-tight">New work order</h2>
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
            Capture just enough to dispatch &mdash; you can fill in the rest later.
          </p>
        </div>

        <div className="space-y-4">
          <Field>
            <FieldLabel>Title</FieldLabel>
            <Input placeholder="e.g. Replace HVAC sensor — Acme HQ" />
          </Field>

          <Field>
            <FieldLabel>Customer</FieldLabel>
            <SelectButton>Acme Co.</SelectButton>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field>
              <FieldLabel>Priority</FieldLabel>
              <SelectButton>Normal</SelectButton>
            </Field>
            <Field>
              <FieldLabel>Due date</FieldLabel>
              <Input placeholder="MM / DD / YYYY" />
            </Field>
          </div>

          <Field>
            <FieldLabel>Description</FieldLabel>
            <Textarea rows={3} placeholder="Optional context for the technician..." />
            <FieldDescription>
              Visible in the technician&rsquo;s mobile app. Markdown is supported.
            </FieldDescription>
          </Field>
        </div>

        <div
          className="flex items-center justify-end gap-2 border-t pt-4"
          style={{ borderColor: 'var(--border)' }}
        >
          <Button variant="ghost" size="sm">
            Cancel
          </Button>
          <Button variant="outline" size="sm">
            Save draft
          </Button>
          <Button size="sm">Create &amp; dispatch</Button>
        </div>
      </div>
    </div>
  );
}
