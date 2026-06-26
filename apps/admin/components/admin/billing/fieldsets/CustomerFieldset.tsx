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
import { FieldsetSurface } from '@/components/admin/billing/FieldsetSurface';
import type {
  ContactOption,
  OrganizationOption,
} from '@/src/lib/billing/billing-bootstrap';

type CustomerFieldsetProps = {
  contacts: ReadonlyArray<ContactOption>;
  organizations: ReadonlyArray<OrganizationOption>;
  contactId: string | null;
  organizationId: string | null;
  contactName: string;
  organizationName: string;
  contactEmail: string | null;
  disabled?: boolean;
  onSelectContact: (contact: ContactOption | null) => void;
  onSelectOrganization: (organization: OrganizationOption | null) => void;
};

export function CustomerFieldset({
  contacts,
  organizations,
  contactId,
  organizationId,
  contactName,
  organizationName,
  contactEmail,
  disabled,
  onSelectContact,
  onSelectOrganization,
}: CustomerFieldsetProps): React.ReactElement {
  const contactItems = React.useMemo(
    () =>
      contacts.map((contact) => ({
        ...contact,
        label: contact.name,
        haystack: `${contact.name ?? ''} ${contact.email ?? ''} ${contact.organizationName ?? ''}`.toLowerCase(),
      })),
    [contacts],
  );
  const orgItems = React.useMemo(
    () =>
      organizations.map((org) => ({
        ...org,
        label: org.name,
        haystack: `${org.name} ${org.relationshipType}`.toLowerCase(),
      })),
    [organizations],
  );
  const selectedContact = contactItems.find((item) => item.id === contactId) ?? null;
  const selectedOrg = orgItems.find((item) => item.id === organizationId) ?? null;

  return (
    <FieldsetSurface
      title="Customer"
      description="Pick the contact or organization that this document is for. Both fields are optional but at least one is recommended."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel>Contact</FieldLabel>
          <Combobox<typeof contactItems[number]>
            items={contactItems}
            value={selectedContact}
            itemToStringLabel={(item) => item?.label ?? ''}
            itemToStringValue={(item) => item?.id ?? ''}
            onValueChange={(next) => onSelectContact(next ?? null)}
            filter={(item, query) => {
              if (!query) return true;
              return item.haystack.includes(query.toLowerCase());
            }}
            disabled={disabled}
          >
            <ComboboxInput
              placeholder={contactName || 'Search contacts…'}
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
          {contactEmail ? (
            <p className="text-xs text-muted-foreground">{contactEmail}</p>
          ) : null}
        </Field>

        <Field>
          <FieldLabel>Organization</FieldLabel>
          <Combobox<typeof orgItems[number]>
            items={orgItems}
            value={selectedOrg}
            itemToStringLabel={(item) => item?.label ?? ''}
            itemToStringValue={(item) => item?.id ?? ''}
            onValueChange={(next) => onSelectOrganization(next ?? null)}
            filter={(item, query) => {
              if (!query) return true;
              return item.haystack.includes(query.toLowerCase());
            }}
            disabled={disabled}
          >
            <ComboboxInput
              placeholder={organizationName || 'Search organizations…'}
              size="sm"
              startAddon={<Search aria-hidden />}
              showTrigger
              showClear
            />
            <ComboboxPopup>
              <ComboboxList>
                <ComboboxEmpty>No matching organizations.</ComboboxEmpty>
                <ComboboxCollection>
                  {(item) => (
                    <ComboboxItem key={item.id} value={item}>
                      <div className="flex w-full items-center justify-between gap-3">
                        <span className="text-sm font-medium">{item.label}</span>
                        <span className="rounded-full border px-1.5 py-0.5 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                          {item.relationshipType}
                        </span>
                      </div>
                    </ComboboxItem>
                  )}
                </ComboboxCollection>
              </ComboboxList>
            </ComboboxPopup>
          </Combobox>
        </Field>
      </div>
    </FieldsetSurface>
  );
}
