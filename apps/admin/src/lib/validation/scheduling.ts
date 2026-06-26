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

export const AVAILABILITY_SUBJECT_KINDS = ['owner', 'contractor', 'business', 'service'] as const;
export type AvailabilitySubjectKind = (typeof AVAILABILITY_SUBJECT_KINDS)[number];

/** Drives calendar overlay layers (contact removed). */
export const AVAILABILITY_LAYER_KEYS = AVAILABILITY_SUBJECT_KINDS;
export type AvailabilityLayerKey = AvailabilitySubjectKind;

export const AVAILABILITY_EXCEPTION_TYPES = ['exclude', 'add'] as const;
export type AvailabilityExceptionType = (typeof AVAILABILITY_EXCEPTION_TYPES)[number];

export const PATTERN_WEEKS = [1, 2] as const;
export type PatternWeeks = (typeof PATTERN_WEEKS)[number];

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
// Availability schedules — publish payload
// -----------------------------------------------------------------------------
const timeString = z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Must be HH:MM or HH:MM:SS.');

export const availabilityPatternDaySchema = z.object({
  weekIndex: z.coerce.number().int().min(0).max(1).default(0),
  dayOfWeek: z.coerce.number().int().min(0).max(6),
  startTime: timeString,
  endTime: timeString,
});

export const availabilityExceptionSchema = z.object({
  exceptionType: z.enum(AVAILABILITY_EXCEPTION_TYPES),
  specificDate: z.string().date(),
  startTime: timeString,
  endTime: timeString,
});

export const availabilitySchedulePublishSchema = z
  .object({
    subjectKind: z.enum(AVAILABILITY_SUBJECT_KINDS),
    userId: optionalUuid,
    serviceId: optionalUuid,
    businessId: optionalUuid,
    patternWeeks: z.coerce.number().int().refine((v) => v === 1 || v === 2),
    validFrom: z.string().date(),
    validTo: z.string().date(),
    slotDurationMinutes: z.coerce.number().int().min(5).max(480).default(60),
    slotGapMinutes: z.coerce.number().int().min(0).max(120).default(15),
    timezone: z.string().trim().max(64).default('America/Chicago'),
    notes: z.string().trim().max(2000).optional(),
    patternDays: z.array(availabilityPatternDaySchema).min(1).max(14),
    exceptions: z.array(availabilityExceptionSchema).default([]),
    confirmOverwrite: z.boolean().default(false),
  })
  .refine(
    (v) => new Date(v.validTo) >= new Date(v.validFrom),
    { message: 'End date must be on or after start date.', path: ['validTo'] },
  )
  .refine(
    (v) => {
      if (v.subjectKind === 'owner' || v.subjectKind === 'contractor') return Boolean(v.userId);
      if (v.subjectKind === 'service') return Boolean(v.serviceId);
      if (v.subjectKind === 'business') return Boolean(v.businessId);
      return false;
    },
    { message: 'Subject entity is required for this availability type.', path: ['subjectKind'] },
  );

export type AvailabilitySchedulePublishInput = z.infer<typeof availabilitySchedulePublishSchema>;

export const availabilityConflictQuerySchema = z.object({
  subjectKind: z.enum(AVAILABILITY_SUBJECT_KINDS),
  userId: optionalUuid,
  serviceId: optionalUuid,
  businessId: optionalUuid,
  validFrom: z.string().date(),
  validTo: z.string().date(),
});

export const availabilityScheduleExceptionsPatchSchema = z.object({
  addExceptions: z.array(availabilityExceptionSchema).default([]),
  removeExceptionIds: z.array(uuid).default([]),
});
export type AvailabilityScheduleExceptionsPatchInput = z.infer<
  typeof availabilityScheduleExceptionsPatchSchema
>;

// Legacy types kept for calendar event rendering during transition
export const AVAILABILITY_TYPES = ['recurring', 'specific_date', 'blocked'] as const;
export type AvailabilityType = (typeof AVAILABILITY_TYPES)[number];

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
