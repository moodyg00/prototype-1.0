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

export type ProductPickerOption = {
  id: string;
  name: string;
  category: string;
};

export function ProductPickerForBom({
  value,
  label,
  disabled,
  onSelect,
}: {
  value: string | null;
  label: string;
  disabled?: boolean;
  onSelect: (product: ProductPickerOption | null) => void;
}): React.ReactElement {
  const [items, setItems] = React.useState<Array<ProductPickerOption & { haystack: string; itemLabel: string }>>([]);

  React.useEffect(() => {
    void (async () => {
      try {
        const res = await fetch('/api/admin/products?scope=inventory', { cache: 'no-store' });
        const body = (await res.json()) as { items?: ProductPickerOption[] };
        setItems(
          (body.items ?? []).map((item) => ({
            ...item,
            itemLabel: item.name,
            haystack: `${item.name} ${item.category}`.toLowerCase(),
          })),
        );
      } catch {
        setItems([]);
      }
    })();
  }, []);

  const mergedItems = React.useMemo(() => {
    if (value && label && !items.some((item) => item.id === value)) {
      return [
        ...items,
        {
          id: value,
          name: label,
          category: '',
          itemLabel: label,
          haystack: label.toLowerCase(),
        },
      ];
    }
    return items;
  }, [items, value, label]);

  const selected = mergedItems.find((item) => item.id === value) ?? null;

  return (
    <Combobox<(typeof mergedItems)[number]>
      items={mergedItems}
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
      <ComboboxInput placeholder="Search products…" size="sm" startAddon={<Search aria-hidden />} showTrigger showClear />
      <ComboboxPopup>
        <ComboboxList>
          <ComboboxEmpty>No products found.</ComboboxEmpty>
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
