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

export type AccountOption = {
  id: string;
  code: string;
  name: string;
  type: string;
};

type CollectionItem = AccountOption & {
  label: string;
  haystack: string;
};

type AccountComboboxProps = {
  accounts: ReadonlyArray<AccountOption>;
  value: string | null;
  onValueChange: (value: string | null) => void;
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
  placeholder?: string;
  id?: string;
  ariaInvalid?: boolean;
};

/**
 * Account picker (combobox) that filters by account code and name. The list
 * is loaded once server-side, so filtering happens in-memory which keeps the
 * keystroke latency tight even on inline-editable rows.
 */
export function AccountCombobox({
  accounts,
  value,
  onValueChange,
  inputProps,
  placeholder = 'Search account…',
  id,
  ariaInvalid,
}: AccountComboboxProps): React.ReactElement {
  const items = React.useMemo<CollectionItem[]>(
    () =>
      accounts.map((account) => ({
        ...account,
        label: `${account.code} — ${account.name}`,
        haystack: `${account.code} ${account.name} ${account.type}`.toLowerCase(),
      })),
    [accounts],
  );

  const selected = React.useMemo(
    () => items.find((item) => item.id === value) ?? null,
    [items, value],
  );

  return (
    <Combobox<CollectionItem>
      items={items}
      value={selected}
      itemToStringLabel={(item) => item?.label ?? ''}
      itemToStringValue={(item) => item?.id ?? ''}
      onValueChange={(next) => onValueChange(next?.id ?? null)}
      filter={(item, query) => {
        if (!query) return true;
        return item.haystack.includes(query.toLowerCase());
      }}
    >
      <ComboboxInput
        id={id}
        aria-invalid={ariaInvalid || undefined}
        placeholder={placeholder}
        size="sm"
        startAddon={<Search aria-hidden />}
        showTrigger
        {...inputProps}
      />
      <ComboboxPopup>
        <ComboboxList>
          <ComboboxEmpty>No matching accounts.</ComboboxEmpty>
          <ComboboxCollection>
            {(item: CollectionItem) => (
              <ComboboxItem key={item.id} value={item}>
                <div className="flex w-full items-center justify-between gap-3">
                  <div className="flex min-w-0 flex-col">
                    <span className="font-medium text-sm tabular-nums">{item.code}</span>
                    <span className="truncate text-muted-foreground text-xs">{item.name}</span>
                  </div>
                  <span className="rounded-full border px-1.5 py-0.5 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                    {item.type}
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
