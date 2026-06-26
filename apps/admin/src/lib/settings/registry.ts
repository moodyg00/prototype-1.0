import { z } from 'zod';

export const SECRET_MASK = '********';

export const SYSTEM_MODULE = 'system';
export const OPERATIONS_MODULE = 'operations';
export const ACCOUNTING_MODULE = 'accounting';

/** Keys under module `system` that cannot be deleted from the Advanced editor. */
export const PROTECTED_SYSTEM_KEYS = ['app', 'cron'] as const;

const bookingFieldSchema = z.object({
  name: z.string().trim().min(1).max(80),
  label: z.string().trim().max(120).optional(),
  required: z.boolean().default(false),
});

export const appUrlSettingSchema = z.object({
  url: z
    .string()
    .trim()
    .max(500)
    .refine((value) => value === '' || z.string().url().safeParse(value).success, {
      message: 'Must be a valid URL.',
    })
    .default(''),
});

export const cronSecretSettingSchema = z.object({
  secret: z.string().max(1024).default(''),
});

export const defaultBookingDurationSchema = z.object({
  minutes: z.coerce.number().int().min(5).max(480).default(60),
});

export const defaultAvailabilityTimezoneSchema = z.object({
  timezone: z.string().trim().min(1).max(80).default('America/New_York'),
});

export const bookingFieldsTemplateSchema = z.object({
  fields: z.array(bookingFieldSchema).default([]),
});

export const fiscalYearStartMonthSchema = z.object({
  month: z.coerce.number().int().min(1).max(12).default(1),
});

export const defaultTaxRateSchema = z.object({
  rate: z.coerce.number().min(0).max(100).default(0),
});

export type SettingRegistryEntry = {
  schema: z.ZodTypeAny;
  defaultValue: unknown;
  description: string;
  isSensitive?: boolean;
  isSystem?: boolean;
};

export const SETTINGS_REGISTRY: Record<string, Record<string, SettingRegistryEntry>> = {
  [OPERATIONS_MODULE]: {
    default_booking_duration: {
      schema: defaultBookingDurationSchema,
      defaultValue: { minutes: 60 },
      description: 'Default booking slot duration in minutes.',
    },
    default_availability_timezone: {
      schema: defaultAvailabilityTimezoneSchema,
      defaultValue: { timezone: 'America/New_York' },
      description: 'Default IANA timezone for availability schedules.',
    },
    booking_fields_template: {
      schema: bookingFieldsTemplateSchema,
      defaultValue: { fields: [] },
      description: 'Optional template of custom fields shown on booking forms.',
    },
  },
  [ACCOUNTING_MODULE]: {
    fiscal_year_start_month: {
      schema: fiscalYearStartMonthSchema,
      defaultValue: { month: 1 },
      description: 'Month (1–12) when the fiscal year begins.',
    },
    default_tax_rate: {
      schema: defaultTaxRateSchema,
      defaultValue: { rate: 0 },
      description: 'Default tax rate percentage applied to new documents (stub).',
    },
  },
  [SYSTEM_MODULE]: {
    app: {
      schema: appUrlSettingSchema,
      defaultValue: { url: '' },
      description: 'Public base URL for links in emails and cron callbacks.',
      isSystem: true,
    },
    cron: {
      schema: cronSecretSettingSchema,
      defaultValue: { secret: '' },
      description: 'Bearer token for /api/cron/* routes.',
      isSensitive: true,
      isSystem: true,
    },
  },
};

export function getRegistryEntry(module: string, key: string): SettingRegistryEntry | null {
  return SETTINGS_REGISTRY[module]?.[key] ?? null;
}

export function isProtectedSetting(module: string, key: string): boolean {
  if (module === SYSTEM_MODULE) {
    return (PROTECTED_SYSTEM_KEYS as readonly string[]).includes(key);
  }
  return getRegistryEntry(module, key)?.isSystem === true;
}

export function parseSettingValue(module: string, key: string, value: unknown): unknown {
  const entry = getRegistryEntry(module, key);
  if (!entry) return value;
  const parsed = entry.schema.safeParse(value ?? entry.defaultValue);
  return parsed.success ? parsed.data : entry.defaultValue;
}

export function validateSettingValue(module: string, key: string, value: unknown): unknown {
  const entry = getRegistryEntry(module, key);
  if (!entry) {
    if (value === undefined || value === null) {
      throw new Error('Value is required.');
    }
    return value;
  }
  return entry.schema.parse(value ?? entry.defaultValue);
}
