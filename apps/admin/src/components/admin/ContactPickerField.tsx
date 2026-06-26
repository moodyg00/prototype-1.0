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
import { Field, FieldLabel } from '@/components/ui/field';

type ContactPickerItem = {
  id: string;
  name: string;
  email: string | null;
  organizationName: string | null;
  label: string;
  haystack: string;
};

function toPickerItem(contact: {
  id: string;
  name: string;
  email: string | null;
  organizationName: string | null;
}): ContactPickerItem {
  return {
    ...contact,
    label: contact.name,
    haystack: `${contact.name} ${contact.email ?? ''} ${contact.organizationName ?? ''}`.toLowerCase(),
  };
}

export function ContactPickerField({
  label,
  helperText,
  value,
  onChange,
  disabled,
  placeholder = 'Search contacts…',
}: {
  label: string;
  helperText?: string;
  value: string;
  onChange: (contactId: string) => void;
  disabled?: boolean;
  placeholder?: string;
}): React.ReactElement {
  const [items, setItems] = React.useState<ContactPickerItem[]>([]);

  React.useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const response = await fetch('/api/admin/contacts?scope=picker');
        const payload = (await response.json()) as {
          items?: Array<{
            id: string;
            name: string;
            email: string | null;
            organizationName: string | null;
          }>;
        };
        if (cancelled) return;
        setItems((payload.items ?? []).map(toPickerItem));
      } catch {
        if (!cancelled) setItems([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const selected = items.find((item) => item.id === value) ?? null;

  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      {helperText ? <p className="text-xs text-muted-foreground">{helperText}</p> : null}
      <Combobox<ContactPickerItem>
        items={items}
        value={selected}
        itemToStringLabel={(item) => item?.label ?? ''}
        itemToStringValue={(item) => item?.id ?? ''}
        onValueChange={(next) => onChange(next?.id ?? '')}
        filter={(item, query) => {
          if (!query) return true;
          return item.haystack.includes(query.toLowerCase());
        }}
        disabled={disabled}
      >
        <ComboboxInput
          placeholder={placeholder}
          size="sm"
          startAddon={<Search aria-hidden />}
          showTrigger
          showClear
        />
        <ComboboxPopup>
          <ComboboxList>
            <ComboboxEmpty>No matching contacts.</ComboboxEmpty>
            <ComboboxCollection>
              {(item) => (
                <ComboboxItem key={item.id} value={item}>
                  <div className="flex w-full flex-col">
                    <span className="text-sm font-medium">{item.label}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {[item.email, item.organizationName].filter(Boolean).join(' · ')}
                    </span>
                  </div>
                </ComboboxItem>
              )}
            </ComboboxCollection>
          </ComboboxList>
        </ComboboxPopup>
      </Combobox>
    </Field>
  );
}
