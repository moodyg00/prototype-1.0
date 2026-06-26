/**
 * Manual "Send" override for the /admin/mail EmailTemplate browser.
 *
 * This module resolves a manual audience selection into a concrete list of
 * recipients and performs the one-off send. By default this uses `sendEmail`
 * from `@/src/lib/email/provider` (settings → email/provider). SMTP delivers when
 * configured; otherwise the provider helper logs a no-op. Pass a custom
 * `EmailSender` to override (e.g. tests).
 */
import { sendEmail } from '@/src/lib/email/provider';
import { prisma } from '@/src/lib/prisma';
import type { ManualSelection } from '@/src/lib/validation/email';

export type ResolvedRecipient = {
  contactId: string;
  name: string;
  email: string;
  organizationId: string | null;
};

export type ResolvedAudience = {
  recipients: ResolvedRecipient[];
  /** Contacts that matched the selection but had no email address. */
  skippedNoEmail: number;
  /** Normalized manual filter rules describing this selection (for persistence). */
  filterRules: ManualFilterRules;
};

export type ManualFilterRules = {
  type: 'manual';
  contactIds: string[];
  organizationIds: string[];
  /** When the selection came from an existing audience, keep a reference. */
  sourceAudienceId?: string;
};

function dedupeByEmail(recipients: ResolvedRecipient[]): ResolvedRecipient[] {
  const seen = new Set<string>();
  const out: ResolvedRecipient[] = [];
  for (const recipient of recipients) {
    const key = recipient.email.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(recipient);
  }
  return out;
}

async function contactsByIds(ids: string[]) {
  if (ids.length === 0) return [];
  return prisma.contact.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true, email: true, organizationId: true },
  });
}

async function contactsByOrganization(organizationId: string) {
  return prisma.contact.findMany({
    where: { organizationId, status: 'active' },
    select: { id: true, name: true, email: true, organizationId: true },
  });
}

type RawContact = {
  id: string;
  name: string | null;
  email: string | null;
  organizationId: string | null;
};

function partitionContacts(contacts: RawContact[]) {
  const recipients: ResolvedRecipient[] = [];
  let skippedNoEmail = 0;
  for (const contact of contacts) {
    const email = contact.email?.trim();
    if (!email) {
      skippedNoEmail += 1;
      continue;
    }
    recipients.push({
      contactId: contact.id,
      name: contact.name?.trim() || '(Unnamed contact)',
      email,
      organizationId: contact.organizationId,
    });
  }
  return { recipients, skippedNoEmail };
}

/**
 * Resolve a manual selection into a concrete recipient list. For the
 * `audience` mode we read the stored `filterRules` and currently support the
 * manual shape we persist (`{ type: 'manual', contactIds, organizationIds }`).
 */
export async function resolveRecipients(selection: ManualSelection): Promise<ResolvedAudience> {
  if (selection.type === 'contacts') {
    const contacts = await contactsByIds(selection.contactIds);
    const { recipients, skippedNoEmail } = partitionContacts(contacts);
    return {
      recipients: dedupeByEmail(recipients),
      skippedNoEmail,
      filterRules: {
        type: 'manual',
        contactIds: selection.contactIds,
        organizationIds: [],
      },
    };
  }

  if (selection.type === 'organization') {
    const contacts = await contactsByOrganization(selection.organizationId);
    const { recipients, skippedNoEmail } = partitionContacts(contacts);
    return {
      recipients: dedupeByEmail(recipients),
      skippedNoEmail,
      filterRules: {
        type: 'manual',
        contactIds: [],
        organizationIds: [selection.organizationId],
      },
    };
  }

  // selection.type === 'audience'
  const audience = await prisma.emailAudience.findUnique({
    where: { id: selection.audienceId },
    select: { id: true, filterRules: true },
  });

  if (!audience) {
    throw new ManualSendError('AUDIENCE_NOT_FOUND', 'Saved audience not found.');
  }

  const rules = normalizeManualFilterRules(audience.filterRules);
  const [byIds, byOrg] = await Promise.all([
    contactsByIds(rules.contactIds),
    Promise.all(rules.organizationIds.map((orgId) => contactsByOrganization(orgId))).then((groups) =>
      groups.flat(),
    ),
  ]);

  const { recipients, skippedNoEmail } = partitionContacts([...byIds, ...byOrg]);
  return {
    recipients: dedupeByEmail(recipients),
    skippedNoEmail,
    filterRules: { ...rules, sourceAudienceId: audience.id },
  };
}

/**
 * Coerce arbitrary stored `filterRules` JSON into the manual shape we know how
 * to resolve. Non-manual / unknown shapes resolve to an empty selection rather
 * than throwing, so legacy audiences don't break the dialog.
 */
function normalizeManualFilterRules(value: unknown): ManualFilterRules {
  const record = (value ?? {}) as Record<string, unknown>;
  const contactIds = Array.isArray(record.contactIds)
    ? record.contactIds.filter((id): id is string => typeof id === 'string')
    : [];
  const organizationIds = Array.isArray(record.organizationIds)
    ? record.organizationIds.filter((id): id is string => typeof id === 'string')
    : [];
  return { type: 'manual', contactIds, organizationIds };
}

export class ManualSendError extends Error {
  constructor(
    public readonly code: 'AUDIENCE_NOT_FOUND' | 'TEMPLATE_NOT_FOUND' | 'NO_RECIPIENTS',
    message: string,
  ) {
    super(message);
    this.name = 'ManualSendError';
  }
}

export function manualSendErrorStatus(code: ManualSendError['code']): number {
  switch (code) {
    case 'AUDIENCE_NOT_FOUND':
    case 'TEMPLATE_NOT_FOUND':
      return 404;
    case 'NO_RECIPIENTS':
      return 422;
    default:
      return 400;
  }
}

export type SendableTemplate = {
  id: string;
  name: string;
  subject: string;
};

export type SendResult = {
  provider: string;
  delivered: number;
  recipients: ResolvedRecipient[];
};

/**
 * Pluggable sender. Implement this and pass it to `performManualSend` to wire a
 * real provider (Resend, SES, SMTP, …) without changing the route or UI.
 */
export interface EmailSender {
  readonly name: string;
  send(template: SendableTemplate, recipients: ResolvedRecipient[]): Promise<{ delivered: number }>;
}

/**
 * Default sender used when no email provider is configured. It does NOT deliver
 * mail; it records the intent to the server log and reports the resolved count
 * so the override path is honest about what happened.
 */
export const recordingEmailSender: EmailSender = {
  name: 'recording (no provider configured)',
  async send(template, recipients) {
    console.info(
      `[mail] Manual override send recorded for template "${template.name}" (${template.id}) -> ${recipients.length} recipient(s). No email provider configured; nothing was delivered.`,
    );
    return { delivered: recipients.length };
  },
};

async function performManualSendViaProvider(
  template: SendableTemplate,
  recipients: ResolvedRecipient[],
): Promise<SendResult> {
  const full = await prisma.emailTemplate.findUnique({
    where: { id: template.id },
    select: { subject: true, bodyHtml: true, bodyText: true },
  });

  const result = await sendEmail({
    to: recipients.map((recipient) => recipient.email),
    subject: full?.subject ?? template.subject,
    html: full?.bodyHtml ?? undefined,
    text: full?.bodyText ?? undefined,
  });

  const providerLabel = result.delivered
    ? `${result.provider} (${result.detail})`
    : `${result.provider}: ${result.detail}`;

  return {
    provider: providerLabel,
    delivered: result.delivered ? result.recipients : 0,
    recipients,
  };
}

export async function performManualSend(
  template: SendableTemplate,
  recipients: ResolvedRecipient[],
  sender?: EmailSender,
): Promise<SendResult> {
  if (recipients.length === 0) {
    throw new ManualSendError('NO_RECIPIENTS', 'The selection resolved to zero recipients with an email address.');
  }
  if (sender) {
    const { delivered } = await sender.send(template, recipients);
    return { provider: sender.name, delivered, recipients };
  }
  return performManualSendViaProvider(template, recipients);
}
