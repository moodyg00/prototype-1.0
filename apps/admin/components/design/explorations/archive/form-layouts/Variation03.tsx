import { Button } from '@/components/ui/button';
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import { Fieldset, FieldsetLegend } from '@/components/ui/fieldset';
import { Input } from '@/components/ui/input';
import { SelectButton } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

// @mock-start
// @mock-end

export interface FormLayoutFieldsetSectionsProps {}

export function FormLayoutFieldsetSections(_props: FormLayoutFieldsetSectionsProps = {}) {
  return (
    <div className="px-6 py-8" style={{ background: 'var(--background)' }}>
      <div className="mx-auto max-w-2xl space-y-10">
        <div className="space-y-1">
          <h2 className="font-semibold text-xl tracking-tight">Account preferences</h2>
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
            Group your settings by area. Saved per section.
          </p>
        </div>

        <Fieldset className="space-y-5">
          <FieldsetLegend className="border-b pb-2 text-base" style={{ borderColor: 'var(--border)' }}>
            Profile
          </FieldsetLegend>
          <div className="grid grid-cols-2 gap-4">
            <Field>
              <FieldLabel>First name</FieldLabel>
              <Input defaultValue="Avery" />
            </Field>
            <Field>
              <FieldLabel>Last name</FieldLabel>
              <Input defaultValue="Reyes" />
            </Field>
            <Field className="col-span-2">
              <FieldLabel>Headline</FieldLabel>
              <Input defaultValue="Operations Lead at Acme Co." />
              <FieldDescription>Shown next to your name in shared records.</FieldDescription>
            </Field>
          </div>
        </Fieldset>

        <Fieldset className="space-y-5">
          <FieldsetLegend className="border-b pb-2 text-base" style={{ borderColor: 'var(--border)' }}>
            Locale
          </FieldsetLegend>
          <div className="grid grid-cols-2 gap-4">
            <Field>
              <FieldLabel>Language</FieldLabel>
              <SelectButton>English (United States)</SelectButton>
            </Field>
            <Field>
              <FieldLabel>Timezone</FieldLabel>
              <SelectButton>America / Los Angeles</SelectButton>
            </Field>
          </div>
        </Fieldset>

        <Fieldset className="space-y-4">
          <FieldsetLegend className="border-b pb-2 text-base" style={{ borderColor: 'var(--border)' }}>
            Communication
          </FieldsetLegend>
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-0.5">
                <div className="font-medium text-sm">Daily digest</div>
                <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                  Summary of new tasks, leads, and overdue items at 8 AM.
                </div>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-0.5">
                <div className="font-medium text-sm">Mention emails</div>
                <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                  Email me whenever someone @mentions me.
                </div>
              </div>
              <Switch defaultChecked />
            </div>
          </div>
        </Fieldset>

        <div
          className="flex items-center justify-end gap-2 border-t pt-5"
          style={{ borderColor: 'var(--border)' }}
        >
          <Button variant="outline" size="sm">
            Cancel
          </Button>
          <Button size="sm">Save preferences</Button>
        </div>
      </div>
    </div>
  );
}
