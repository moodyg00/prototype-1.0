import { PRODUCT_CATEGORIES } from '@/src/lib/validation/products';
import { SERVICE_CATEGORIES } from '@/src/lib/validation/services';
import { WORK_ORDER_STATUSES } from '@/src/lib/validation/work-orders';

export const ESTIMATE_STATUSES = [
  'draft',
  'sent',
  'viewed',
  'accepted',
  'rejected',
  'expired',
] as const;

export const INVOICE_STATUSES = [
  'draft',
  'sent',
  'paid',
  'partial',
  'overdue',
  'cancelled',
] as const;

export const CONTACT_TYPES = [
  'customer',
  'vendor',
  'contractor',
  'owner',
  'employee',
  'business_contact',
  'other',
] as const;

export const ORGANIZATION_RELATIONSHIP_TYPES = [
  'customer',
  'vendor',
  'contractor',
  'affiliate',
  'lead',
  'partner',
  'supplier',
  'other',
] as const;

export const LEAD_STATUSES = ['new', 'contacted', 'quoted', 'converted', 'lost'] as const;

export const CHART_OF_ACCOUNT_TYPES = ['asset', 'liability', 'equity', 'income', 'expense'] as const;

export const BANK_ACCOUNT_TYPES = ['checking', 'savings', 'cash', 'credit_card', 'other'] as const;

export const BANK_CARD_TYPES = ['virtual', 'physical'] as const;

export const AD_STATUSES = ['draft', 'active', 'paused', 'completed'] as const;

export const CAMPAIGN_STATUSES = ['active', 'paused', 'completed'] as const;

function formatLabel(value: string) {
  return value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function createFilterOptions(values: readonly string[]) {
  return [
    { value: 'all', label: 'All' },
    ...values.map((value) => ({ value, label: formatLabel(value) })),
  ];
}

export {
  PRODUCT_CATEGORIES,
  SERVICE_CATEGORIES,
  WORK_ORDER_STATUSES,
};
