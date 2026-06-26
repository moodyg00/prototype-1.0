'use client';

import { Search } from 'lucide-react';
import * as React from 'react';

import {
  Combobox,
  ComboboxCollection,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxPopup,
} from '@/components/ui/combobox';

export type JournalReferenceOption = {
  kind: 'invoice' | 'estimate' | 'work-order' | 'bank-transaction' | 'custom';
  reference: string;
  label: string;
  href: string | null;
  score: number;
};

type ReferenceComboboxProps = {
  value: string;
  onValueChange: (value: string) => void;
  id?: string;
  placeholder?: string;
  disabled?: boolean;
};

const KIND_LABEL: Record<JournalReferenceOption['kind'], string> = {
  invoice: 'Invoice',
  estimate: 'Estimate',
  'work-order': 'Work order',
  'bank-transaction': 'Bank txn',
  custom: 'Custom',
};

export function ReferenceCombobox({
  value,
  onValueChange,
  id,
  placeholder = 'Search invoices, estimates, work orders, bank txns…',
  disabled = false,
}: ReferenceComboboxProps): React.ReactElement {
  const [options, setOptions] = React.useState<JournalReferenceOption[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [query, setQuery] = React.useState('');

  React.useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (query.trim()) params.set('q', query.trim());
        const response = await fetch(`/api/admin/journal-entries/reference-search?${params.toString()}`, {
          cache: 'no-store',
        });
        const body = (await response.json()) as { options?: JournalReferenceOption[] };
        if (!cancelled) {
          setOptions(body.options ?? []);
        }
      } catch {
        if (!cancelled) setOptions([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, query.trim() ? 180 : 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query]);

  const items = React.useMemo(
    () =>
      options.map((option) => ({
        ...option,
        id: `${option.kind}:${option.reference}`,
        haystack: `${option.reference} ${option.label}`.toLowerCase(),
      })),
    [options],
  );

  const selected = React.useMemo(() => {
    if (!value.trim()) return null;
    return items.find((item) => item.reference === value) ?? {
      id: `custom:${value}`,
      kind: 'custom' as const,
      reference: value,
      label: value,
      href: null,
      score: 0,
      haystack: value.toLowerCase(),
    };
  }, [items, value]);

  return (
    <Combobox<(typeof items)[number]>
      items={items}
      value={selected}
      itemToStringLabel={(item) => item?.label ?? ''}
      itemToStringValue={(item) => item?.reference ?? ''}
      onValueChange={(next) => onValueChange(next?.reference ?? '')}
      disabled={disabled}
      filter={(item, filterQuery) => {
        if (!filterQuery) return true;
        return item.haystack.includes(filterQuery.toLowerCase());
      }}
    >
      <ComboboxInput
        id={id}
        placeholder={placeholder}
        size="sm"
        startAddon={<Search aria-hidden />}
        showTrigger
        showClear
        disabled={disabled}
        onChange={(event) => {
          setQuery(event.target.value);
          onValueChange(event.target.value);
        }}
      />
      <ComboboxPopup>
        <ComboboxList>
          <ComboboxEmpty>{loading ? 'Searching…' : 'No matching references.'}</ComboboxEmpty>
          <ComboboxCollection>
            {(item) => (
              <ComboboxItem key={item.id} value={item}>
                <div className="flex w-full items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{item.reference}</div>
                    <div className="truncate text-xs text-muted-foreground">{item.label}</div>
                  </div>
                  <span className="shrink-0 rounded-full border px-1.5 py-0.5 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                    {KIND_LABEL[item.kind]}
                  </span>
                </div>
              </ComboboxItem>
            )}
          </ComboboxCollection>
        </ComboboxList>
      </ComboboxPopup>
    </Combobox>
  );
}
