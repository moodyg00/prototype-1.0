'use client';

import { Search } from 'lucide-react';
import {
  Combobox,
  ComboboxCollection,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@/components/ui/combobox';
import {
  Field,
  FieldDescription,
  FieldLabel,
} from '@/components/ui/field';

// @mock-start
const MOCK_FRAMEWORKS = [
  'Next.js',
  'Remix',
  'SvelteKit',
  'Astro',
  'Nuxt',
  'SolidStart',
  'Qwik City',
  'Redwood',
  'Eleventy',
  'Hugo',
];
// @mock-end

export interface SelectAutocompleteProps {
  frameworks?: ReadonlyArray<string>;
}

export function SelectAutocomplete({
  frameworks = MOCK_FRAMEWORKS,
}: SelectAutocompleteProps = {}) {
  const items = frameworks as string[];
  return (
    <div className="grid gap-8 px-8 py-10 md:grid-cols-2">
      <Field>
        <FieldLabel>Framework</FieldLabel>
        <Combobox items={items}>
          <ComboboxInput
            placeholder="Pick a framework…"
            startAddon={<Search />}
          />
        </Combobox>
        <FieldDescription>
          Trigger-only view — clicking opens a filtering popup.
        </FieldDescription>
      </Field>

      <div className="space-y-2">
        <div
          className="font-mono text-[10px] uppercase tracking-[0.18em]"
          style={{ color: 'var(--muted-foreground)' }}
        >
          Open + filter — live
        </div>
        <Combobox items={items} inline open>
          <div
            className="relative flex flex-col rounded-lg border bg-popover not-dark:bg-clip-padding shadow-lg/5"
            style={{ borderColor: 'var(--border)' }}
          >
            <div className="border-b p-2" style={{ borderColor: 'var(--border)' }}>
              <ComboboxInput
                placeholder="Filter frameworks…"
                startAddon={<Search />}
              />
            </div>
            <ComboboxList className="max-h-56">
              <ComboboxEmpty>No frameworks match.</ComboboxEmpty>
              <ComboboxCollection>
                {(item: string) => (
                  <ComboboxItem key={item} value={item}>
                    {item}
                  </ComboboxItem>
                )}
              </ComboboxCollection>
            </ComboboxList>
          </div>
        </Combobox>
      </div>
    </div>
  );
}
