export type MailTemplate = {
  id: string;
  name: string;
  subject: string;
  preheader: string | null;
  bodyHtml: string | null;
  bodyText: string | null;
  footerText: string | null;
  category: string;
  status: string;
  accentColor: string;
  updatedAt: string | null;
  createdAt: string | null;
};

export type MailContact = {
  id: string;
  name: string;
  email: string | null;
  organizationId: string | null;
  organizationName: string | null;
};

export type MailOrganization = {
  id: string;
  name: string;
  relationshipType: string;
};

export type MailAudience = {
  id: string;
  name: string;
  description: string | null;
  estimatedRecipientCount: number;
};

export type SendMode = 'contacts' | 'organization' | 'audience';

export const TEMPLATE_CATEGORIES = [
  'promotional',
  'newsletter',
  'announcement',
  'seasonal',
  'retention',
  'event',
] as const;

export const TEMPLATE_STATUSES = ['draft', 'in_review', 'approved', 'archived'] as const;

const STATUS_VARIANTS: Record<string, 'outline' | 'warning' | 'success' | 'secondary'> = {
  draft: 'outline',
  in_review: 'warning',
  approved: 'success',
  archived: 'secondary',
};

export function statusBadgeVariant(status: string): 'outline' | 'warning' | 'success' | 'secondary' {
  return STATUS_VARIANTS[status] ?? 'outline';
}

export function humanize(value: string): string {
  return value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function formatUpdatedAt(value: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
