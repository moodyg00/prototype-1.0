'use client';

import { Check } from 'lucide-react';
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Field,
  FieldDescription,
  FieldLabel,
} from '@/components/ui/field';

// @mock-start
const MOCK_PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];
const MOCK_DEFAULT_VALUE = 'Medium';
// @mock-end

export interface SelectClassicSingleProps {
  priorities?: ReadonlyArray<string>;
  defaultValue?: string;
}

export function SelectClassicSingle({
  priorities = MOCK_PRIORITIES,
  defaultValue = MOCK_DEFAULT_VALUE,
}: SelectClassicSingleProps = {}) {
  return (
    <div className="grid gap-8 px-8 py-10 md:grid-cols-2">
      <Field>
        <FieldLabel>Priority</FieldLabel>
        <Select defaultValue={defaultValue}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectPopup>
            {priorities.map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectPopup>
        </Select>
        <FieldDescription>
          Classic native-feel — single value, opens on click.
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
          style={{
            borderColor: 'var(--border)',
            background: 'var(--popover, var(--card))',
          }}
        >
          {priorities.map((p, idx) => (
            <div
              key={p}
              className="grid min-h-8 grid-cols-[1rem_1fr] items-center gap-2 rounded-sm py-1 ps-2 pe-4 text-sm"
              style={{
                background: idx === 1 ? 'var(--muted)' : undefined,
                color: 'var(--foreground)',
              }}
            >
              <span className="col-start-1">
                {idx === 1 && <Check className="size-3.5" />}
              </span>
              <span className="col-start-2">{p}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
