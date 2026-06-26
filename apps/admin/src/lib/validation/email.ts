/**
 * Validation schemas for the `/admin/mail` EmailTemplate browser and its
 * manual "Send" override flow.
 *
 *   - `emailTemplateCreateSchema` / `emailTemplateUpdateSchema`: payloads for
 *     POST /api/admin/email-templates and PATCH /api/admin/email-templates/[id]
 *   - `manualSelectionSchema`: the three audience-selection modes used by the
 *     Send dialog (individual contacts, one organization, or a saved audience)
 *   - `manualSendSchema`: payload for POST /api/admin/email-send
 *   - `emailAudienceCreateSchema`: payload for POST /api/admin/email-audiences
 */
import { z } from 'zod';

const uuid = z.string().uuid({ message: 'Must be a valid UUID.' });

export const EMAIL_TEMPLATE_CATEGORIES = [
  'promotional',
  'newsletter',
  'announcement',
  'seasonal',
  'retention',
  'event',
] as const;

export const EMAIL_TEMPLATE_STATUSES = ['draft', 'in_review', 'approved', 'archived'] as const;

const optionalText = z
  .string()
  .trim()
  .max(20000)
  .optional()
  .transform((value) => (value && value.length > 0 ? value : undefined));

export const emailTemplateCreateSchema = z.object({
  name: z.string().trim().min(1, 'Name is required.').max(120),
  subject: z.string().trim().min(1, 'Subject is required.').max(255),
  preheader: z.string().trim().max(255).optional().transform((v) => (v && v.length > 0 ? v : undefined)),
  bodyHtml: optionalText,
  bodyText: optionalText,
  footerText: optionalText,
  category: z.enum(EMAIL_TEMPLATE_CATEGORIES).default('promotional'),
  status: z.enum(EMAIL_TEMPLATE_STATUSES).default('draft'),
});

export const emailTemplateUpdateSchema = emailTemplateCreateSchema.partial();

export type EmailTemplateCreateInput = z.infer<typeof emailTemplateCreateSchema>;
export type EmailTemplateUpdateInput = z.infer<typeof emailTemplateUpdateSchema>;

/**
 * The three ways the Send dialog can target recipients. These are also what we
 * persist into `EmailAudience.filterRules` when the user saves a selection.
 */
export const manualSelectionSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('contacts'),
    contactIds: z.array(uuid).min(1, 'Select at least one contact.'),
  }),
  z.object({
    type: z.literal('organization'),
    organizationId: uuid,
  }),
  z.object({
    type: z.literal('audience'),
    audienceId: uuid,
  }),
]);

export type ManualSelection = z.infer<typeof manualSelectionSchema>;

export const emailAudienceCreateSchema = z.object({
  name: z.string().trim().min(1, 'Audience name is required.').max(255),
  description: z.string().trim().max(2000).optional().transform((v) => (v && v.length > 0 ? v : undefined)),
  selection: manualSelectionSchema,
});

export type EmailAudienceCreateInput = z.infer<typeof emailAudienceCreateSchema>;

export const manualSendSchema = z.object({
  templateId: uuid,
  selection: manualSelectionSchema,
  /** Optionally persist this selection as a new EmailAudience as part of sending. */
  saveAsAudience: z
    .object({
      name: z.string().trim().min(1, 'Audience name is required.').max(255),
    })
    .optional(),
});

export type ManualSendInput = z.infer<typeof manualSendSchema>;
