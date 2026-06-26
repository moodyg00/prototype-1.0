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
import type { OfferingOption } from '@/src/lib/billing/billing-bootstrap';

export function ServiceLinePicker({
  offerings,
  value,
  label,
  disabled,
  onSelect,
}: {
  offerings: ReadonlyArray<OfferingOption>;
  value: string | null;
  label: string;
  disabled?: boolean;
  onSelect: (service: OfferingOption | null) => void;
}): React.ReactElement {
  const [remote, setRemote] = React.useState<OfferingOption[]>([]);

  React.useEffect(() => {
    void (async () => {
      try {
        const res = await fetch('/api/admin/offerings?scope=picker', { cache: 'no-store' });
        const body = (await res.json()) as { items?: OfferingOption[] };
        setRemote(body.items ?? []);
      } catch {
        setRemote([]);
      }
    })();
  }, []);

  const items = React.useMemo(() => {
    const map = new Map<string, OfferingOption & { haystack: string; itemLabel: string }>();
    for (const item of [...offerings, ...remote]) {
      map.set(item.id, {
        ...item,
        itemLabel: item.name,
        haystack: `${item.name} ${item.category}`.toLowerCase(),
      });
    }
    if (value && label && !map.has(value)) {
      map.set(value, {
        id: value,
        name: label,
        category: '',
        suggestedPrice: null,
        itemLabel: label,
        haystack: label.toLowerCase(),
      });
    }
    return [...map.values()];
  }, [offerings, remote, value, label]);

  const selected = items.find((item) => item.id === value) ?? null;

  return (
    <Combobox<(typeof items)[number]>
      items={items}
      value={selected}
      itemToStringLabel={(item) => item?.itemLabel ?? ''}
      itemToStringValue={(item) => item?.id ?? ''}
      onValueChange={(next) => onSelect(next ?? null)}
      filter={(item, query) => {
        if (!query) return true;
        return item.haystack.includes(query.toLowerCase());
      }}
      disabled={disabled}
    >
      <ComboboxInput placeholder="Search offerings…" size="sm" startAddon={<Search aria-hidden />} showTrigger showClear />
      <ComboboxPopup>
        <ComboboxList>
          <ComboboxEmpty>No offerings found.</ComboboxEmpty>
          <ComboboxCollection>
            {(item) => (
              <ComboboxItem key={item.id} value={item}>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{item.name}</span>
                  <span className="text-xs text-muted-foreground">{item.category}</span>
                </div>
              </ComboboxItem>
            )}
          </ComboboxCollection>
        </ComboboxList>
      </ComboboxPopup>
    </Combobox>
  );
}
