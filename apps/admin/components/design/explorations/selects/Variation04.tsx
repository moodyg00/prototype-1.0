'use client';

import { Check } from 'lucide-react';
import {
  Select,
  SelectGroup,
  SelectGroupLabel,
  SelectItem,
  SelectPopup,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Field,
  FieldDescription,
  FieldLabel,
} from '@/components/ui/field';

type SelectGroupedSection = { label: string; items: string[] };

// @mock-start
const MOCK_GROUPS: SelectGroupedSection[] = [
  { label: 'Operations', items: ['Open', 'In progress', 'Blocked'] },
  { label: 'Finance', items: ['Awaiting payment', 'Paid', 'Refunded'] },
  { label: 'Closed', items: ['Completed', 'Cancelled'] },
];
const MOCK_ACTIVE_VALUE = 'In progress';
// @mock-end

export interface SelectGroupedSectionsProps {
  groups?: ReadonlyArray<SelectGroupedSection>;
  activeValue?: string;
}

export function SelectGroupedSections({
  groups = MOCK_GROUPS,
  activeValue = MOCK_ACTIVE_VALUE,
}: SelectGroupedSectionsProps = {}) {
  return (
    <div className="grid gap-8 px-8 py-10 md:grid-cols-2">
      <Field>
        <FieldLabel>Status</FieldLabel>
        <Select defaultValue={activeValue}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectPopup>
            {groups.map((group, idx) => (
              <SelectGroup key={group.label}>
                <SelectGroupLabel>{group.label}</SelectGroupLabel>
                {group.items.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
                {idx < groups.length - 1 && <SelectSeparator />}
              </SelectGroup>
            ))}
          </SelectPopup>
        </Select>
        <FieldDescription>
          Status values stay grouped by the team that owns them.
        </FieldDescription>
      </Field>

      <div className="space-y-2">
        <div
          className="font-mono text-[10px] uppercase tracking-[0.18em]"
          style={{ color: 'var(--muted-foreground)' }}
        >
          Open-state preview
        </div>
        <div
          className="relative rounded-lg border bg-popover not-dark:bg-clip-padding p-1 shadow-lg/5"
          style={{ borderColor: 'var(--border)' }}
        >
          {groups.map((group, gIdx) => (
            <div key={group.label} className={gIdx > 0 ? 'mt-1' : ''}>
              <div
                className="px-2 py-1.5 font-medium text-xs"
                style={{ color: 'var(--muted-foreground)' }}
              >
                {group.label}
              </div>
              {group.items.map((item) => {
                const active = item === activeValue;
                return (
                  <div
                    key={item}
                    className="grid min-h-8 grid-cols-[1rem_1fr] items-center gap-2 rounded-sm py-1 ps-2 pe-4 text-sm"
                    style={{
                      background: active ? 'var(--muted)' : undefined,
                    }}
                  >
                    <span className="col-start-1">
                      {active && <Check className="size-3.5" />}
                    </span>
                    <span className="col-start-2">{item}</span>
                  </div>
                );
              })}
              {gIdx < groups.length - 1 && (
                <div
                  className="mx-2 my-1 h-px"
                  style={{ background: 'var(--border)' }}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
