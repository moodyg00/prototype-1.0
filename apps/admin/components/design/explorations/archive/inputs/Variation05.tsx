import { Search, Sparkles, Hash } from 'lucide-react';
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
import { Kbd, KbdGroup } from '@/components/ui/kbd';

// @mock-start
// @mock-end

export interface InputTrailingKbdProps {}

export function InputTrailingKbd(_props: InputTrailingKbdProps = {}) {
  return (
    <div className="grid gap-6 px-8 py-10 sm:grid-cols-2">
      <Field className="sm:col-span-2">
        <FieldLabel>Global search</FieldLabel>
        <InputGroup>
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
          <InputGroupInput placeholder="Search work, contacts, invoices…" />
          <InputGroupAddon align="inline-end">
            <KbdGroup>
              <Kbd>⌘</Kbd>
              <Kbd>K</Kbd>
            </KbdGroup>
          </InputGroupAddon>
        </InputGroup>
        <FieldDescription>
          Kbd hint as a trailing addon — the canonical command-bar pattern.
        </FieldDescription>
      </Field>

      <Field>
        <FieldLabel>Ask the agent</FieldLabel>
        <InputGroup>
          <InputGroupAddon>
            <Sparkles style={{ color: 'var(--primary)' }} />
          </InputGroupAddon>
          <InputGroupInput placeholder="What would you like to do?" />
          <InputGroupAddon align="inline-end">
            <Kbd>⌘J</Kbd>
          </InputGroupAddon>
        </InputGroup>
        <FieldDescription>
          Single shortcut hint, primary-tinted leading icon.
        </FieldDescription>
      </Field>

      <Field>
        <FieldLabel>Jump to record</FieldLabel>
        <InputGroup>
          <InputGroupAddon>
            <Hash />
          </InputGroupAddon>
          <InputGroupInput placeholder="WO-2026-0421" />
          <InputGroupAddon align="inline-end">
            <Kbd>↵</Kbd>
          </InputGroupAddon>
        </InputGroup>
        <FieldDescription>
          Trailing return key signals submit-on-enter.
        </FieldDescription>
      </Field>
    </div>
  );
}
