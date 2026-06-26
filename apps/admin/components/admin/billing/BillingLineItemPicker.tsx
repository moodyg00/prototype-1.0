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
import type { OfferingOption, ProductOption } from '@/src/lib/billing/billing-bootstrap';
import type { LineItemKind } from '@/src/lib/billing/line-item-kinds';
import { lineItemKindHasPicker } from '@/src/lib/billing/line-item-kinds';

type PickerItem = {
  id: string;
  name: string;
  category: string;
  unitPrice: string | null;
  itemLabel: string;
  haystack: string;
};

function toPickerItem(
  item: { id: string; name: string; category: string },
  unitPrice: string | null,
): PickerItem {
  return {
    id: item.id,
    name: item.name,
    category: item.category,
    unitPrice,
    itemLabel: item.name,
    haystack: `${item.name} ${item.category}`.toLowerCase(),
  };
}

function pickerEndpoint(kind: LineItemKind): string | null {
  if (kind === 'service') return '/api/admin/offerings?scope=picker';
  if (kind === 'product') return '/api/admin/products';
  if (kind === 'material') return '/api/admin/products?scope=inventory';
  return null;
}

function pickerPlaceholder(kind: LineItemKind): string {
  if (kind === 'service') return 'Search offerings…';
  if (kind === 'product') return 'Search catalog products…';
  if (kind === 'material') return 'Search materials…';
  return 'Search…';
}

function pickerEmptyLabel(kind: LineItemKind): string {
  if (kind === 'service') return 'No offerings found.';
  if (kind === 'product') return 'No products found.';
  if (kind === 'material') return 'No materials found.';
  return 'No matches.';
}

export function BillingLineItemPicker({
  kind,
  offerings,
  products,
  materials,
  valueId,
  valueLabel,
  disabled,
  onSelect,
  instanceKey,
}: {
  kind: LineItemKind;
  offerings: ReadonlyArray<OfferingOption>;
  products: ReadonlyArray<ProductOption>;
  materials: ReadonlyArray<ProductOption>;
  valueId: string | null;
  valueLabel: string;
  disabled?: boolean;
  instanceKey?: string;
  onSelect: (selection: {
    id: string;
    name: string;
    unitPrice: string | null;
  } | null) => void;
}): React.ReactElement | null {
  const [remote, setRemote] = React.useState<PickerItem[]>([]);

  React.useEffect(() => {
    const endpoint = pickerEndpoint(kind);
    if (!endpoint) {
      setRemote([]);
      return;
    }
    void (async () => {
      try {
        const res = await fetch(endpoint, { cache: 'no-store' });
        const body = (await res.json()) as {
          items?: Array<{
            id: string;
            name: string;
            category: string;
            unitPrice?: string | null;
            suggestedPrice?: string | null;
          }>;
        };
        if (!res.ok) {
          setRemote([]);
          return;
        }
        setRemote(
          (body.items ?? []).map((item) =>
            toPickerItem(
              item,
              item.unitPrice ?? item.suggestedPrice ?? null,
            ),
          ),
        );
      } catch {
        setRemote([]);
      }
    })();
  }, [kind]);

  const items = React.useMemo(() => {
    const map = new Map<string, PickerItem>();
    const seed =
      kind === 'service'
        ? offerings.map((item) => toPickerItem(item, item.suggestedPrice))
        : kind === 'product'
          ? products.map((item) => toPickerItem(item, item.unitPrice))
          : kind === 'material'
            ? materials.map((item) => toPickerItem(item, item.unitPrice))
            : [];
    for (const item of [...seed, ...remote]) {
      map.set(item.id, item);
    }
    if (valueId && valueLabel && !map.has(valueId)) {
      map.set(valueId, {
        id: valueId,
        name: valueLabel,
        category: '',
        unitPrice: null,
        itemLabel: valueLabel,
        haystack: valueLabel.toLowerCase(),
      });
    }
    return [...map.values()];
  }, [kind, offerings, products, materials, remote, valueId, valueLabel]);

  if (!lineItemKindHasPicker(kind)) return null;

  const selected = items.find((item) => item.id === valueId) ?? null;

  return (
    <Combobox<PickerItem>
      key={instanceKey ?? kind}
      items={items}
      value={selected}
      itemToStringLabel={(item) => item?.itemLabel ?? ''}
      itemToStringValue={(item) => item?.id ?? ''}
      onValueChange={(next) =>
        onSelect(
          next
            ? { id: next.id, name: next.name, unitPrice: next.unitPrice }
            : null,
        )
      }
      filter={(item, query) => {
        if (!query) return true;
        return item.haystack.includes(query.toLowerCase());
      }}
      disabled={disabled}
    >
      <ComboboxInput
        placeholder={pickerPlaceholder(kind)}
        size="sm"
        startAddon={<Search aria-hidden />}
        showTrigger
        showClear
      />
      <ComboboxPopup>
        <ComboboxList>
          <ComboboxEmpty>{pickerEmptyLabel(kind)}</ComboboxEmpty>
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
