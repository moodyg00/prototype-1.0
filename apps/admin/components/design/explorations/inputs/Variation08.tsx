import {
  Field,
  FieldDescription,
  FieldLabel,
} from '@/components/ui/field';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from '@/components/ui/input-group';

// @mock-start
// @mock-end

export interface InputPrefixSuffixProps {}

export function InputPrefixSuffix(_props: InputPrefixSuffixProps = {}) {
  return (
    <div className="grid gap-6 px-8 py-10 sm:grid-cols-2">
      <Field>
        <FieldLabel>Subdomain</FieldLabel>
        <InputGroup>
          <InputGroupAddon>
            <InputGroupText>https://</InputGroupText>
          </InputGroupAddon>
          <InputGroupInput placeholder="acme" defaultValue="acme" />
          <InputGroupAddon align="inline-end">
            <InputGroupText>.proto-2.app</InputGroupText>
          </InputGroupAddon>
        </InputGroup>
        <FieldDescription>
          Both prefix and suffix sit inline — the input edges blend with the
          addons.
        </FieldDescription>
      </Field>

      <Field>
        <FieldLabel>Amount</FieldLabel>
        <InputGroup>
          <InputGroupAddon>
            <InputGroupText>$</InputGroupText>
          </InputGroupAddon>
          <InputGroupInput
            inputMode="decimal"
            placeholder="0.00"
            defaultValue="1,240.00"
          />
          <InputGroupAddon align="inline-end">
            <InputGroupText>USD</InputGroupText>
          </InputGroupAddon>
        </InputGroup>
        <FieldDescription>
          Currency prefix + ISO suffix is the canonical money input.
        </FieldDescription>
      </Field>

      <Field>
        <FieldLabel>Discount</FieldLabel>
        <InputGroup>
          <InputGroupInput
            inputMode="numeric"
            placeholder="0"
            defaultValue="15"
          />
          <InputGroupAddon align="inline-end">
            <InputGroupText>%</InputGroupText>
          </InputGroupAddon>
        </InputGroup>
        <FieldDescription>
          Suffix only — for percentages and units.
        </FieldDescription>
      </Field>

      <Field>
        <FieldLabel>Slug</FieldLabel>
        <InputGroup>
          <InputGroupAddon>
            <InputGroupText>/projects/</InputGroupText>
          </InputGroupAddon>
          <InputGroupInput placeholder="my-project" />
        </InputGroup>
        <FieldDescription>
          Path-like prefix anchors the user to where this value will live.
        </FieldDescription>
      </Field>
    </div>
  );
}
