import { User, Building2, Hash } from 'lucide-react';
import {
  Field,
  FieldDescription,
  FieldLabel,
} from '@/components/ui/field';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';

const FILLED_CLS =
  'border-transparent shadow-none before:hidden bg-[color-mix(in_srgb,var(--muted)_70%,var(--card)_30%)] dark:bg-[color-mix(in_srgb,var(--muted)_60%,var(--background)_40%)] hover:bg-[color-mix(in_srgb,var(--muted)_85%,var(--card)_15%)] has-focus-visible:bg-[var(--card)] has-focus-visible:border-[var(--border)] has-focus-visible:ring-[3px]';

// @mock-start
// @mock-end

export interface InputFilledSoftTintProps {}

export function InputFilledSoftTint(_props: InputFilledSoftTintProps = {}) {
  return (
    <div className="grid gap-6 px-8 py-10 sm:grid-cols-2">
      <Field>
        <FieldLabel>Full name</FieldLabel>
        <InputGroup className={FILLED_CLS}>
          <InputGroupAddon>
            <User />
          </InputGroupAddon>
          <InputGroupInput
            placeholder="Jane Doe"
            defaultValue="Jane Doe"
          />
        </InputGroup>
        <FieldDescription>
          Soft tinted background — reads as a content surface, not a control
          boundary.
        </FieldDescription>
      </Field>

      <Field>
        <FieldLabel>Company</FieldLabel>
        <InputGroup className={FILLED_CLS}>
          <InputGroupAddon>
            <Building2 />
          </InputGroupAddon>
          <InputGroupInput placeholder="Vertex Labs Inc." />
        </InputGroup>
        <FieldDescription>
          Border only appears on focus.
        </FieldDescription>
      </Field>

      <Field>
        <FieldLabel>Reference</FieldLabel>
        <InputGroup className={FILLED_CLS}>
          <InputGroupAddon>
            <Hash />
          </InputGroupAddon>
          <InputGroupInput placeholder="WO-2026-0421" />
        </InputGroup>
        <FieldDescription>
          Use a fast-scanning monospace look for IDs in dense forms.
        </FieldDescription>
      </Field>

      <Field>
        <FieldLabel>Notes (filled, no icon)</FieldLabel>
        <InputGroup className={FILLED_CLS}>
          <InputGroupInput placeholder="Anything we should know?" />
        </InputGroup>
        <FieldDescription>
          Filled style still works without a leading icon.
        </FieldDescription>
      </Field>
    </div>
  );
}
