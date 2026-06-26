import type { RecordIndexConfig } from '@/src/components/admin/RecordIndexPage';
import {
  AD_STATUSES,
  BANK_ACCOUNT_TYPES,
  BANK_CARD_TYPES,
  CAMPAIGN_STATUSES,
  CHART_OF_ACCOUNT_TYPES,
  CONTACT_TYPES,
  createFilterOptions,
  ESTIMATE_STATUSES,
  INVOICE_STATUSES,
  LEAD_STATUSES,
  ORGANIZATION_RELATIONSHIP_TYPES,
  PRODUCT_CATEGORIES,
  SERVICE_CATEGORIES,
  WORK_ORDER_STATUSES,
} from '@/src/lib/admin/filter-options';

const GRID = 'grid gap-4 md:grid-cols-2 xl:grid-cols-3';
const GRID_TWO = 'grid gap-4 md:grid-cols-2';

/** DB-backed sections load records from the API; mock cards are not used. */
const EMPTY_RECORDS: RecordIndexConfig['records'] = [];

export const WORK_ORDERS_CONFIG: RecordIndexConfig = {
  eyebrow: 'Operations',
  title: 'Work Orders',
  description: 'Field work records, active dispatch queue, and crew readiness in one view.',
  searchPlaceholder: 'Search work orders, clients, crews, or zones',
  filterLabel: 'Status',
  emptyMessage: 'No work orders match this search/filter combination.',
  filterOptions: createFilterOptions(WORK_ORDER_STATUSES),
  gridClassName: GRID,
  records: EMPTY_RECORDS,
};

export const ESTIMATES_CONFIG: RecordIndexConfig = {
  eyebrow: 'Operations',
  title: 'Estimates',
  description: 'Open quotes, revision flow, and conversion readiness.',
  searchPlaceholder: 'Search estimate IDs, client names, or service scope',
  filterLabel: 'Status',
  emptyMessage: 'No estimates found for this filter.',
  filterOptions: createFilterOptions(ESTIMATE_STATUSES),
  gridClassName: GRID,
  records: EMPTY_RECORDS,
};

export const CATALOG_CONFIG: RecordIndexConfig = {
  eyebrow: 'Operations',
  title: 'Catalog',
  description: 'Product and inventory records used by estimates and work orders.',
  searchPlaceholder: 'Search SKUs, materials, and catalog groups',
  filterLabel: 'Category',
  emptyMessage: 'No catalog records match your search.',
  filterOptions: createFilterOptions(PRODUCT_CATEGORIES),
  gridClassName: GRID,
  records: EMPTY_RECORDS,
};

export const OFFERINGS_CONFIG: RecordIndexConfig = {
  eyebrow: 'Operations',
  title: 'Offerings',
  description: 'Packaged services and pricing bundles used by sales and fulfillment.',
  searchPlaceholder: 'Search offerings, bundle names, or categories',
  filterLabel: 'Category',
  emptyMessage: 'No offerings are visible for this filter.',
  filterOptions: createFilterOptions(SERVICE_CATEGORIES),
  gridClassName: GRID,
  records: EMPTY_RECORDS,
};

export const ORGANIZATIONS_CONFIG: RecordIndexConfig = {
  eyebrow: 'Customer Relations',
  title: 'Organizations',
  description: 'Account-level CRM records with ownership and health indicators.',
  searchPlaceholder: 'Search organizations, owners, and account segments',
  filterLabel: 'Relationship',
  emptyMessage: 'No organizations match this filter.',
  filterOptions: createFilterOptions(ORGANIZATION_RELATIONSHIP_TYPES),
  gridClassName: GRID,
  records: EMPTY_RECORDS,
};

export const CONTACTS_CONFIG: RecordIndexConfig = {
  eyebrow: 'Customer Relations',
  title: 'Contacts',
  description: 'Primary contact records with communication channel and assignment visibility.',
  searchPlaceholder: 'Search contact names, roles, or organizations',
  filterLabel: 'Type',
  emptyMessage: 'No contacts found for this query.',
  filterOptions: createFilterOptions(CONTACT_TYPES),
  gridClassName: GRID,
  records: EMPTY_RECORDS,
};

export const CAMPAIGNS_CONFIG: RecordIndexConfig = {
  eyebrow: 'Marketing & Ads',
  title: 'Campaigns',
  description: 'Campaign records with budget, channel mix, and pacing snapshots.',
  searchPlaceholder: 'Search campaign names, channels, or objectives',
  filterLabel: 'Status',
  emptyMessage: 'No campaigns match this filter.',
  filterOptions: createFilterOptions(CAMPAIGN_STATUSES),
  gridClassName: GRID,
  records: EMPTY_RECORDS,
};

export const LEADS_CONFIG: RecordIndexConfig = {
  eyebrow: 'Customer Relations',
  title: 'Leads',
  description: 'Lead records with source, owner, and immediate conversion context.',
  searchPlaceholder: 'Search leads, sources, and assigned owner',
  filterLabel: 'Status',
  emptyMessage: 'No leads found for this filter.',
  filterOptions: createFilterOptions(LEAD_STATUSES),
  gridClassName: GRID,
  records: EMPTY_RECORDS,
};

export const INVOICES_CONFIG: RecordIndexConfig = {
  eyebrow: 'Banking',
  title: 'Invoices',
  description: 'Invoice records with settlement stage, amount, and owner visibility.',
  searchPlaceholder: 'Search invoice IDs, clients, or payment method',
  filterLabel: 'Status',
  emptyMessage: 'No invoices match this search/filter.',
  filterOptions: createFilterOptions(INVOICE_STATUSES),
  gridClassName: GRID,
  records: EMPTY_RECORDS,
};

export const ADS_CONFIG: RecordIndexConfig = {
  eyebrow: 'Marketing & Ads',
  title: 'Ads',
  description: 'Ad creative records with channel, spend, and performance snapshot.',
  searchPlaceholder: 'Search ad names, channels, or creative type',
  filterLabel: 'Status',
  emptyMessage: 'No ad records matched your filter.',
  filterOptions: createFilterOptions(AD_STATUSES),
  gridClassName: GRID,
  records: EMPTY_RECORDS,
};

export const CHART_OF_ACCOUNTS_CONFIG: RecordIndexConfig = {
  eyebrow: 'Accounting',
  title: 'Chart of Accounts',
  description: 'Ledger account records grouped for reporting and reconciliation.',
  searchPlaceholder: 'Search account codes, account names, and type',
  filterLabel: 'Account Type',
  emptyMessage: 'No accounts found for this filter.',
  filterOptions: createFilterOptions(CHART_OF_ACCOUNT_TYPES),
  gridClassName: GRID_TWO,
  records: EMPTY_RECORDS,
};

export const BANK_CARDS_CONFIG: RecordIndexConfig = {
  eyebrow: 'Banking',
  title: 'Cards',
  description: 'Issued card records, limits, and activity stage.',
  hideToolbar: true,
  searchPlaceholder: 'Search card labels, owners, and limits',
  filterLabel: 'Card Type',
  emptyMessage: 'No cards match this filter.',
  filterOptions: createFilterOptions(BANK_CARD_TYPES),
  gridClassName: GRID_TWO,
  records: EMPTY_RECORDS,
};

export const BANK_ACCOUNTS_CONFIG: RecordIndexConfig = {
  eyebrow: 'Banking',
  title: 'Bank Accounts',
  description: 'Connected account records with cash and reconciliation state.',
  hideToolbar: true,
  searchPlaceholder: 'Search bank accounts, institutions, and owner',
  filterLabel: 'Account Type',
  emptyMessage: 'No bank accounts found for this filter.',
  filterOptions: createFilterOptions(BANK_ACCOUNT_TYPES),
  gridClassName: GRID_TWO,
  records: EMPTY_RECORDS,
};
