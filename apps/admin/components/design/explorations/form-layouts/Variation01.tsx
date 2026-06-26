import { Button } from '@/components/ui/button';
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { SelectButton } from '@/components/ui/select';

// @mock-start
// @mock-end

export interface FormLayoutSingleColumnProps {}

export function FormLayoutSingleColumn(_props: FormLayoutSingleColumnProps = {}) {
  return (
    <div className="px-6 py-8" style={{ background: 'var(--background)' }}>
      <div className="mx-auto max-w-xl space-y-6">
        <div className="space-y-1">
          <h2 className="font-semibold text-xl tracking-tight">Workspace settings</h2>
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
            Update how this workspace appears across the product.
          </p>
        </div>

        <div className="space-y-5">
          <Field>
            <FieldLabel>Workspace name</FieldLabel>
            <Input defaultValue="Proto-2 Operations" />
          </Field>

          <Field>
            <FieldLabel>Workspace URL</FieldLabel>
            <Input defaultValue="proto2-ops" />
            <FieldDescription>
              Shown in shareable links: app.proto-2.com/proto2-ops
            </FieldDescription>
          </Field>

          <Field>
            <FieldLabel>Default timezone</FieldLabel>
            <SelectButton>America / Los Angeles (UTC-7)</SelectButton>
          </Field>

          <Field>
            <FieldLabel>Description</FieldLabel>
            <Textarea
              rows={3}
              defaultValue="Internal admin workspace for the field-services team."
            />
            <FieldDescription>Optional. Visible to admins in the workspace switcher.</FieldDescription>
          </Field>
        </div>

        <div
          className="flex items-center justify-end gap-2 border-t pt-5"
          style={{ borderColor: 'var(--border)' }}
        >
          <Button variant="outline" size="sm">
            Cancel
          </Button>
          <Button size="sm">Save changes</Button>
        </div>
      </div>
    </div>
  );
}
