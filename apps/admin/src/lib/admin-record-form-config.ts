import { PRODUCT_CATEGORIES } from '@/src/lib/validation/products';

export type AdminCreateSection =
  | 'contacts'
  | 'leads'
  | 'organizations'
  | 'catalog'
  | 'offerings'
  | 'bills'
  | 'ads'
  | 'campaigns';

/** Mercury-synced banking records — list/view only, no manual CRUD. */
export const READ_ONLY_BANK_SECTIONS = ['bank-accounts', 'bank-cards', 'bank-transactions'] as const;
export type ReadOnlyBankSection = (typeof READ_ONLY_BANK_SECTIONS)[number];

/** Sections with dedicated create wizards — not generic RecordCreatePage. */
export const DEDICATED_CREATE_SECTIONS = ['work-orders', 'estimates', 'invoices'] as const;
export type DedicatedCreateSection = (typeof DEDICATED_CREATE_SECTIONS)[number];

export type AdminDbSection = AdminCreateSection | DedicatedCreateSection | 'bank-accounts' | 'bank-cards' | 'chart-of-accounts';

export type AdminCreateFieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'date'
  | 'select'
  | 'checkbox'
  | 'contact-picker';

export type AdminCreateField = {
  name: string;
  label: string;
  type: AdminCreateFieldType;
  placeholder?: string;
  helperText?: string;
  options?: Array<{ label: string; value: string }>;
  defaultValue?: string | boolean;
};

export type AdminCreateFieldGroup = {
  title: string;
  description?: string;
  fields: AdminCreateField[];
};

export type AdminCreateDefinition = {
  section: AdminCreateSection;
  title: string;
  description: string;
  submitLabel: string;
  groups: AdminCreateFieldGroup[];
};

function selectOptions(values: string[]) {
  return values.map((value) => ({
    label: value
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' '),
    value,
  }));
}

export const ADMIN_CREATE_DEFINITIONS: Record<AdminCreateSection, AdminCreateDefinition> = {
  contacts: {
    section: 'contacts',
    title: 'New Contact',
    description: 'Create a contact record with the primary communication details.',
    submitLabel: 'Create contact',
    groups: [
      {
        title: 'Identity',
        fields: [
          { name: 'name', label: 'Name', type: 'text', placeholder: 'Avery Kim' },
          { name: 'organizationName', label: 'Organization name', type: 'text', placeholder: 'Northside Plaza' },
          { name: 'title', label: 'Title', type: 'text', placeholder: 'Facilities lead' },
          { name: 'email', label: 'Email', type: 'text', placeholder: 'avery@northside.com' },
          { name: 'phone', label: 'Phone', type: 'text', placeholder: '(555) 123-4567' },
        ],
      },
      {
        title: 'Classification',
        fields: [
          {
            name: 'type',
            label: 'Type',
            type: 'select',
            defaultValue: 'other',
            options: selectOptions(['customer', 'vendor', 'contractor', 'owner', 'employee', 'business_contact', 'other']),
          },
          {
            name: 'status',
            label: 'Status',
            type: 'select',
            defaultValue: 'active',
            options: selectOptions(['active', 'inactive']),
          },
          { name: 'source', label: 'Source', type: 'text', placeholder: 'Website form' },
        ],
      },
      {
        title: 'Notes',
        fields: [{ name: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Decision-maker notes, follow-up context, or CRM details.' }],
      },
    ],
  },
  leads: {
    section: 'leads',
    title: 'New Lead',
    description: 'Create a lead and capture the follow-up context in one form.',
    submitLabel: 'Create lead',
    groups: [
      {
        title: 'Core',
        fields: [
          { name: 'name', label: 'Name', type: 'text', placeholder: 'Acme Expansion' },
          { name: 'organizationName', label: 'Organization name', type: 'text', placeholder: 'Acme Corp' },
          {
            name: 'contactId',
            label: 'Contact',
            type: 'contact-picker',
            placeholder: 'Search contacts…',
            helperText: 'Link an existing contact. Create contacts separately if needed.',
          },
          {
            name: 'status',
            label: 'Status',
            type: 'select',
            defaultValue: 'new',
            options: selectOptions(['new', 'contacted', 'quoted', 'converted', 'lost']),
          },
          {
            name: 'source',
            label: 'Source',
            type: 'select',
            defaultValue: 'website_organic',
            options: selectOptions(['website_organic', 'facebook', 'instagram', 'craigslist', 'nextdoor', 'referral', 'physical_media', 'in_person']),
          },
        ],
      },
      {
        title: 'Qualification',
        fields: [
          { name: 'expectedValue', label: 'Expected value', type: 'number', placeholder: '48000' },
          { name: 'nextFollowUp', label: 'Next follow-up', type: 'date' },
          { name: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Pipeline notes, objections, or qualification context.' },
        ],
      },
    ],
  },
  organizations: {
    section: 'organizations',
    title: 'New Organization',
    description: 'Create a customer or vendor organization record.',
    submitLabel: 'Create organization',
    groups: [
      {
        title: 'Identity',
        fields: [
          { name: 'name', label: 'Name', type: 'text', placeholder: 'Northside Plaza' },
          {
            name: 'relationshipType',
            label: 'Relationship type',
            type: 'select',
            defaultValue: 'other',
            options: selectOptions(['customer', 'vendor', 'contractor', 'affiliate', 'lead', 'partner', 'supplier', 'other']),
          },
          {
            name: 'organizationType',
            label: 'Organization type',
            type: 'select',
            defaultValue: 'company',
            options: selectOptions(['company', 'nonprofit', 'government', 'individual', 'other']),
          },
          {
            name: 'status',
            label: 'Status',
            type: 'select',
            defaultValue: 'active',
            options: selectOptions(['active', 'inactive', 'pending']),
          },
        ],
      },
      {
        title: 'Profile',
        fields: [
          { name: 'industry', label: 'Industry', type: 'text', placeholder: 'Real estate' },
          { name: 'phone', label: 'Phone', type: 'text', placeholder: '(555) 123-4567' },
          { name: 'website', label: 'Website', type: 'text', placeholder: 'https://example.com' },
          { name: 'source', label: 'Source', type: 'text', placeholder: 'Referral' },
        ],
      },
      {
        title: 'Notes',
        fields: [{ name: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Relationship notes, account context, or billing details.' }],
      },
    ],
  },
  catalog: {
    section: 'catalog',
    title: 'New Catalog Item',
    description: 'Create a product record for the catalog.',
    submitLabel: 'Create catalog item',
    groups: [
      {
        title: 'Product',
        fields: [
          { name: 'name', label: 'Name', type: 'text', placeholder: 'Copper Coil 3/4"' },
          {
            name: 'category',
            label: 'Category',
            type: 'select',
            defaultValue: 'other',
            options: selectOptions([...PRODUCT_CATEGORIES]),
          },
          { name: 'sku', label: 'SKU', type: 'text', placeholder: 'MAT-302' },
          { name: 'unitOfMeasure', label: 'Unit of measure', type: 'text', placeholder: 'roll' },
          { name: 'unitPrice', label: 'Unit price', type: 'number', placeholder: '84.00' },
          {
            name: 'purchaseUrl',
            label: 'Purchase URL',
            type: 'text',
            placeholder: 'https://vendor.example.com/product',
            helperText: 'Optional link to buy this item online.',
          },
        ],
      },
      {
        title: 'Flags',
        fields: [
          { name: 'isForSale', label: 'For sale', type: 'checkbox', defaultValue: false },
          { name: 'isInternalUse', label: 'Internal use', type: 'checkbox', defaultValue: true },
        ],
      },
      {
        title: 'Description',
        fields: [{ name: 'description', label: 'Description', type: 'textarea', placeholder: 'Stock and reorder details.' }],
      },
    ],
  },
  offerings: {
    section: 'offerings',
    title: 'New Offering',
    description: 'Create a service offering record.',
    submitLabel: 'Create offering',
    groups: [
      {
        title: 'Service',
        fields: [
          { name: 'name', label: 'Name', type: 'text', placeholder: 'Comfort Baseline' },
          {
            name: 'category',
            label: 'Category',
            type: 'select',
            defaultValue: 'general',
            options: selectOptions(['plumbing', 'electrical', 'hvac', 'landscaping', 'cleaning', 'general', 'other']),
          },
          { name: 'estimatedDurationMinutes', label: 'Estimated duration (minutes)', type: 'number', placeholder: '120' },
          { name: 'suggestedPrice', label: 'Suggested price', type: 'number', placeholder: '159.00' },
          { name: 'isActive', label: 'Active offering', type: 'checkbox', defaultValue: true },
        ],
      },
      {
        title: 'Details',
        fields: [
          { name: 'quotePrompt', label: 'Quote prompt', type: 'textarea', placeholder: 'Short prompt used in quoting and sales copy.' },
          { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Bundle or service description.' },
        ],
      },
    ],
  },
  bills: {
    section: 'bills',
    title: 'New Bill',
    description: 'Create a bill and vendor record together.',
    submitLabel: 'Create bill',
    groups: [
      {
        title: 'Vendor',
        fields: [
          { name: 'vendorName', label: 'Vendor name', type: 'text', placeholder: 'Allied Supply' },
          {
            name: 'status',
            label: 'Status',
            type: 'select',
            defaultValue: 'draft',
            options: selectOptions(['draft', 'received', 'approved', 'paid', 'overdue', 'cancelled']),
          },
          { name: 'issueDate', label: 'Issue date', type: 'date' },
          { name: 'dueDate', label: 'Due date', type: 'date' },
        ],
      },
      {
        title: 'Totals',
        fields: [
          { name: 'subtotal', label: 'Subtotal', type: 'number', placeholder: '4280' },
          { name: 'taxAmount', label: 'Tax amount', type: 'number', placeholder: '0' },
          { name: 'totalAmount', label: 'Total amount', type: 'number', placeholder: '4280' },
          { name: 'amountPaid', label: 'Amount paid', type: 'number', placeholder: '0' },
        ],
      },
      {
        title: 'Notes',
        fields: [{ name: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Approval details, aging notes, or payment context.' }],
      },
    ],
  },
  ads: {
    section: 'ads',
    title: 'New Ad',
    description: 'Create an ad record and optionally seed a matching campaign.',
    submitLabel: 'Create ad',
    groups: [
      {
        title: 'Creative',
        fields: [
          { name: 'name', label: 'Name', type: 'text', placeholder: 'Emergency Cooling Reel' },
          { name: 'platform', label: 'Platform', type: 'text', placeholder: 'meta' },
          { name: 'campaignName', label: 'Campaign name', type: 'text', placeholder: 'Summer Comfort Push' },
          {
            name: 'status',
            label: 'Status',
            type: 'select',
            defaultValue: 'draft',
            options: selectOptions(['draft', 'active', 'paused', 'completed']),
          },
        ],
      },
      {
        title: 'Budget and schedule',
        fields: [
          { name: 'budget', label: 'Budget', type: 'number', placeholder: '1280' },
          { name: 'startDate', label: 'Start date', type: 'date' },
          { name: 'endDate', label: 'End date', type: 'date' },
        ],
      },
      {
        title: 'Copy',
        fields: [
          { name: 'headline', label: 'Headline', type: 'text', placeholder: 'Fast response, same-day repair' },
          { name: 'hook', label: 'Hook', type: 'text', placeholder: 'Call before the heat gets worse' },
          { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Creative brief or ad copy.' },
        ],
      },
    ],
  },
  campaigns: {
    section: 'campaigns',
    title: 'New Campaign',
    description: 'Create a campaign record with its budget and pacing window.',
    submitLabel: 'Create campaign',
    groups: [
      {
        title: 'Campaign',
        fields: [
          { name: 'name', label: 'Name', type: 'text', placeholder: 'Summer Comfort Push' },
          { name: 'platform', label: 'Platform', type: 'text', placeholder: 'meta' },
          {
            name: 'status',
            label: 'Status',
            type: 'select',
            defaultValue: 'active',
            options: selectOptions(['active', 'paused', 'completed']),
          },
          { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Campaign objective and targeting summary.' },
        ],
      },
      {
        title: 'Budget and schedule',
        fields: [
          { name: 'totalBudget', label: 'Total budget', type: 'number', placeholder: '9200' },
          { name: 'startDate', label: 'Start date', type: 'date' },
          { name: 'endDate', label: 'End date', type: 'date' },
        ],
      },
    ],
  },
};

export const ADMIN_CREATEABLE_SECTIONS = Object.keys(ADMIN_CREATE_DEFINITIONS) as AdminCreateSection[];

const ADMIN_DB_SECTIONS: AdminDbSection[] = [
  ...ADMIN_CREATEABLE_SECTIONS,
  ...DEDICATED_CREATE_SECTIONS,
  'bank-accounts',
  'bank-cards',
  'chart-of-accounts',
];

export function isAdminCreateSection(section: string): section is AdminCreateSection {
  return Object.prototype.hasOwnProperty.call(ADMIN_CREATE_DEFINITIONS, section);
}

export function isDedicatedCreateSection(section: string): section is DedicatedCreateSection {
  return (DEDICATED_CREATE_SECTIONS as readonly string[]).includes(section);
}

export function getAdminCreateDefinition(section: string): AdminCreateDefinition | null {
  return isAdminCreateSection(section) ? ADMIN_CREATE_DEFINITIONS[section] : null;
}

export function isAdminDbSection(section: string): section is AdminDbSection {
  return ADMIN_DB_SECTIONS.includes(section as AdminDbSection);
}

export function isReadOnlyBankSection(section: string): section is ReadOnlyBankSection {
  return (READ_ONLY_BANK_SECTIONS as readonly string[]).includes(section);
}

export function getAdminCreateHref(section: string): string | null {
  if (isReadOnlyBankSection(section)) {
    return null;
  }
  if (isDedicatedCreateSection(section) || isAdminCreateSection(section)) {
    return `/admin/${section}/new`;
  }
  return null;
}
