'use client';

import { Search, Globe } from 'lucide-react';
import {
  Combobox,
  ComboboxCollection,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxGroupLabel,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@/components/ui/combobox';
import {
  Field,
  FieldDescription,
  FieldLabel,
} from '@/components/ui/field';

type Tz = { value: string; label: string; offset: string };
type TzGroup = { region: string; items: Tz[] };

// @mock-start
const MOCK_TIMEZONES: TzGroup[] = [
  {
    region: 'Americas',
    items: [
      { value: 'America/Los_Angeles', label: 'Los Angeles', offset: 'UTC−8' },
      { value: 'America/Denver', label: 'Denver', offset: 'UTC−7' },
      { value: 'America/Chicago', label: 'Chicago', offset: 'UTC−6' },
      { value: 'America/New_York', label: 'New York', offset: 'UTC−5' },
      { value: 'America/Sao_Paulo', label: 'São Paulo', offset: 'UTC−3' },
    ],
  },
  {
    region: 'Europe / Africa',
    items: [
      { value: 'Europe/London', label: 'London', offset: 'UTC+0' },
      { value: 'Europe/Berlin', label: 'Berlin', offset: 'UTC+1' },
      { value: 'Africa/Cairo', label: 'Cairo', offset: 'UTC+2' },
    ],
  },
  {
    region: 'Asia / Pacific',
    items: [
      { value: 'Asia/Dubai', label: 'Dubai', offset: 'UTC+4' },
      { value: 'Asia/Singapore', label: 'Singapore', offset: 'UTC+8' },
      { value: 'Asia/Tokyo', label: 'Tokyo', offset: 'UTC+9' },
      { value: 'Australia/Sydney', label: 'Sydney', offset: 'UTC+11' },
    ],
  },
];
const MOCK_DEFAULT_TZ = 'America/New_York';
// @mock-end

export interface SelectTimezoneGroupedProps {
  timezones?: ReadonlyArray<TzGroup>;
  defaultTimezone?: string;
}

export function SelectTimezoneGrouped({
  timezones = MOCK_TIMEZONES,
  defaultTimezone = MOCK_DEFAULT_TZ,
}: SelectTimezoneGroupedProps = {}) {
  const items = timezones as TzGroup[];
  return (
    <div className="grid gap-8 px-8 py-10 md:grid-cols-2">
      <Field>
        <FieldLabel>Timezone</FieldLabel>
        <Combobox items={items} defaultValue={defaultTimezone}>
          <ComboboxInput
            placeholder="Search city or region…"
            startAddon={<Globe />}
          />
        </Combobox>
        <FieldDescription>
          Trigger view — opens a region-grouped picker with live filter.
        </FieldDescription>
      </Field>

      <div className="space-y-2">
        <div
          className="font-mono text-[10px] uppercase tracking-[0.18em]"
          style={{ color: 'var(--muted-foreground)' }}
        >
          Open + grouped — live
        </div>
        <Combobox items={items} inline open>
          <div
            className="relative flex flex-col rounded-lg border bg-popover not-dark:bg-clip-padding shadow-lg/5"
            style={{ borderColor: 'var(--border)' }}
          >
            <div className="border-b p-2" style={{ borderColor: 'var(--border)' }}>
              <ComboboxInput
                placeholder="Search timezones…"
                startAddon={<Search />}
              />
            </div>
            <ComboboxList className="max-h-72">
              <ComboboxEmpty>No timezones match.</ComboboxEmpty>
              <ComboboxCollection>
                {(group: TzGroup) => (
                  <ComboboxGroup key={group.region} items={group.items}>
                    <ComboboxGroupLabel>{group.region}</ComboboxGroupLabel>
                    <ComboboxCollection>
                      {(item: Tz) => (
                        <ComboboxItem
                          key={item.value}
                          value={item.value}
                          className="grid-cols-[1rem_1fr_auto]"
                        >
                          <span className="col-start-2">{item.label}</span>
                          <span
                            className="col-start-3 ms-3 font-mono text-[11px] tabular-nums"
                            style={{ color: 'var(--muted-foreground)' }}
                          >
                            {item.offset}
                          </span>
                        </ComboboxItem>
                      )}
                    </ComboboxCollection>
                  </ComboboxGroup>
                )}
              </ComboboxCollection>
            </ComboboxList>
          </div>
        </Combobox>
      </div>
    </div>
  );
}
