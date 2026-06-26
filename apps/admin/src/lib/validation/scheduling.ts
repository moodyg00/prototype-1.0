/**
 * Validation schemas for the Calendar / scheduling feature.
 *
 *   - Booking links (`/api/admin/booking-links`)
 *   - Availability rules (`/api/admin/availability-rules`)
 *   - Admin booking create (`/api/admin/calendar/bookings`)
 *   - Public booking submission (`/api/book/[token]/submit`)
 *
 * Mirrors the patterns in `src/lib/validation/email.ts`.
 */
import { z } from 'zod';

const uuid = z.string().uuid({ message: 'Must be a valid UUID.' });

const optionalUuid = uuid.optional();

// -----------------------------------------------------------------------------
// Shared enums (kept in sync with the `///` CHECK comments in schema.prisma)
// -----------------------------------------------------------------------------
export const BOOKING_LINK_KINDS = ['standard', 'personalized', 'confirmation'] as const;
export type BookingLinkKind = (typeof BOOKING_LINK_KINDS)[number];

export const BOOKING_STATUSES = [
  'draft',
  'pending_customer',
  'unconfirmed',
  'confirmed',
  'cancelled',
  'expired',
] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

/** Statuses that render as "tentative" (gray) on the calendar grid. */
export const TENTATIVE_BOOKING_STATUSES: BookingStatus[] = [
  'draft',
  'pending_customer',
  'unconfirmed',
];

export const BOOKING_SOURCES = ['admin', 'booking_link', 'import'] as const;
export type BookingSource = (typeof BOOKING_SOURCES)[number];

export const AVAILABILITY_SUBJECT_KINDS = ['business', 'contact', 'user', 'service'] as const;
export type AvailabilitySubjectKind = (typeof AVAILABILITY_SUBJECT_KINDS)[number];

/** Drives the overlay-dropdown layers on the calendar. */
export const AVAILABILITY_LAYER_KEYS = [
  'contractor',
  'contact',
  'owner',
  'business',
  'service',
] as const;
export type AvailabilityLayerKey = (typeof AVAILABILITY_LAYER_KEYS)[number];

export const AVAILABILITY_TYPES = ['recurring', 'specific_date', 'blocked'] as const;
export type AvailabilityType = (typeof AVAILABILITY_TYPES)[number];

export const FIELD_TYPES = ['text', 'email', 'tel', 'textarea', 'date', 'select'] as const;
export type FieldType = (typeof FIELD_TYPES)[number];

// -----------------------------------------------------------------------------
// Booking-link intake field definitions (`fieldsToCollect` JSON shape)
// -----------------------------------------------------------------------------
export const collectFieldSchema = z.object({
  key: z.string().trim().min(1).max(60),
  label: z.string().trim().min(1).max(120),
  type: z.enum(FIELD_TYPES).default('text'),
  required: z.boolean().default(false),
  options: z.array(z.string().trim().min(1).max(120)).optional(),
});
export type CollectField = z.infer<typeof collectFieldSchema>;

/** A concrete time range proposed/selected for a booking. */
export const proposedSlotSchema = z.object({
  startsAt: z.string().datetime({ offset: true }),
  endsAt: z.string().datetime({ offset: true }),
});
export type ProposedSlot = z.infer<typeof proposedSlotSchema>;

// -----------------------------------------------------------------------------
// Booking links
// -----------------------------------------------------------------------------
const slug = z
  .string()
  .trim()
  .min(1, 'Slug is required.')
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug must be lowercase letters, numbers, and single hyphens.',
  });

export const bookingLinkCreateSchema = z.object({
  name: z.string().trim().min(1, 'Name is required.').max(255),
  slug: slug.optional(),
  linkKind: z.enum(BOOKING_LINK_KINDS).default('standard'),
  isActive: z.boolean().default(true),
  serviceId: optionalUuid,
  contactId: optionalUuid,
  /** When set, confirmed bookings attach to this work order instead of minting one from the contact. */
  workOrderId: optionalUuid,
  durationMinutes: z.coerce.number().int().min(5).max(8 * 60).optional(),
  channel: z.string().trim().max(80).optional(),
  knownData: z.record(z.string(), z.unknown()).optional(),
  fieldsToCollect: z.array(collectFieldSchema).default([]),
  proposedSlots: z.array(proposedSlotSchema).optional(),
  expiresAt: z.string().datetime({ offset: true }).optional(),
});
export type BookingLinkCreateInput = z.infer<typeof bookingLinkCreateSchema>;

export const bookingLinkUpdateSchema = bookingLinkCreateSchema.partial();
export type BookingLinkUpdateInput = z.infer<typeof bookingLinkUpdateSchema>;

// -----------------------------------------------------------------------------
// Availability rules — replace-the-set PUT payload
// -----------------------------------------------------------------------------
export const availabilityRuleSchema = z
  .object({
    subjectKind: z.enum(AVAILABILITY_SUBJECT_KINDS),
    businessId: optionalUuid,
    contactId: optionalUuid,
    userId: optionalUuid,
    serviceId: optionalUuid,
    layerKey: z.enum(AVAILABILITY_LAYER_KEYS),
    availabilityType: z.enum(AVAILABILITY_TYPES),
    dayOfWeek: z.coerce.number().int().min(0).max(6).optional(),
    specificDate: z.string().date().optional(),
    startTime: z
      .string()
      .regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Must be HH:MM or HH:MM:SS.')
      .optional(),
    endTime: z
      .string()
      .regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Must be HH:MM or HH:MM:SS.')
      .optional(),
    isAvailable: z.boolean().default(true),
    isPublished: z.boolean().default(true),
    timezone: z.string().trim().max(64).default('America/Chicago'),
    notes: z.string().trim().max(2000).optional(),
  })
  .refine(
    (r) => r.availabilityType !== 'recurring' || r.dayOfWeek !== undefined,
    { message: 'Recurring rules require a day of week.', path: ['dayOfWeek'] },
  )
  .refine(
    (r) => r.availabilityType === 'recurring' || r.specificDate !== undefined,
    { message: 'Specific-date / blocked rules require a date.', path: ['specificDate'] },
  );
export type AvailabilityRuleInput = z.infer<typeof availabilityRuleSchema>;

export const availabilityRulesReplaceSchema = z.object({
  rules: z.array(availabilityRuleSchema).max(500),
});
export type AvailabilityRulesReplaceInput = z.infer<typeof availabilityRulesReplaceSchema>;

// -----------------------------------------------------------------------------
// Admin booking create (drag-create + manual)
// -----------------------------------------------------------------------------
export const adminBookingCreateSchema = z
  .object({
    contactId: optionalUuid,
    serviceId: optionalUuid,
    workOrderId: optionalUuid,
    status: z.enum(BOOKING_STATUSES).default('confirmed'),
    startsAt: z.string().datetime({ offset: true }),
    endsAt: z.string().datetime({ offset: true }),
    notes: z.string().trim().max(2000).optional(),
    /** When true, also mint a `confirmation` BookingLink with the slot(s). */
    sendConfirmationLink: z.boolean().default(false),
  })
  .refine((b) => new Date(b.endsAt) > new Date(b.startsAt), {
    message: 'End must be after start.',
    path: ['endsAt'],
  });
export type AdminBookingCreateInput = z.infer<typeof adminBookingCreateSchema>;

// -----------------------------------------------------------------------------
// Public booking submission
// -----------------------------------------------------------------------------
export const publicBookingSubmitSchema = z.object({
  /** Values keyed by the link's `fieldsToCollect[].key`. */
  collectedData: z.record(z.string(), z.unknown()).default({}),
  /** Chosen slot (confirmation links: one of the proposed; others: picked). */
  startsAt: z.string().datetime({ offset: true }),
  endsAt: z.string().datetime({ offset: true }),
});
export type PublicBookingSubmitInput = z.infer<typeof publicBookingSubmitSchema>;

/**
 * Validate a public submission's `collectedData` against a link's required
 * fields. Returns a flat list of human-readable errors (empty when valid).
 */
export function validateCollectedData(
  fields: CollectField[],
  collected: Record<string, unknown>,
): string[] {
  const errors: string[] = [];
  for (const field of fields) {
    if (!field.required) continue;
    const value = collected[field.key];
    if (value === undefined || value === null || String(value).trim() === '') {
      errors.push(`${field.label} is required.`);
    }
  }
  return errors;
}
