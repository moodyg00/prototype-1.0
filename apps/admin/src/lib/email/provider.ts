/**
 * Reusable email-provider helper.
 *
 * The provider configuration is stored in the generic `settings` key/value
 * store under `module = "email"`, `key = "provider"` (a single JSONB row holding
 * the whole config). This module loads/parses that row and exposes a
 * provider-agnostic `sendEmail` that the mail send path can import later.
 *
 * Real delivery is implemented for SMTP via `nodemailer` (added as an optional,
 * dynamically-imported dependency). When a provider's credentials are missing —
 * or for API providers we don't have an SDK wired for yet — `sendEmail` falls
 * back to a no-op that resolves successfully and logs the intent rather than
 * fabricating delivery.
 */
import { z } from 'zod';

import { prisma } from '@/src/lib/prisma';

export const EMAIL_SETTING_MODULE = 'email';
export const EMAIL_SETTING_KEY = 'provider';

export const EMAIL_PROVIDERS = ['none', 'smtp', 'resend', 'sendgrid', 'postmark'] as const;
export type EmailProviderId = (typeof EMAIL_PROVIDERS)[number];

/** Providers whose secret is a single API key (vs. SMTP host/port/credentials). */
export const API_KEY_PROVIDERS: EmailProviderId[] = ['resend', 'sendgrid', 'postmark'];

/**
 * Union of every credential field across providers. Kept flat/partial so the
 * config shape is provider-agnostic at the edges; only the fields relevant to
 * the selected provider are populated.
 */
export interface EmailCredentials {
  /** SMTP host, e.g. smtp.example.com */
  host?: string;
  /** SMTP port, e.g. 587 or 465 */
  port?: number;
  /** SMTP TLS — true for implicit TLS (465), false for STARTTLS (587) */
  secure?: boolean;
  /** SMTP auth username */
  username?: string;
  /** SMTP auth password (SECRET) */
  password?: string;
  /** API key for resend/sendgrid/postmark (SECRET) */
  apiKey?: string;
}

export interface EmailProviderConfig {
  provider: EmailProviderId;
  fromName: string;
  fromEmail: string;
  replyTo: string;
  credentials: EmailCredentials;
}

/** Keys within `credentials` that hold secrets and must be masked by the API. */
export const SECRET_CREDENTIAL_KEYS = ['password', 'apiKey'] as const;
export type SecretCredentialKey = (typeof SECRET_CREDENTIAL_KEYS)[number];

/** Placeholder the API returns/accepts in place of any stored secret value. */
export const SECRET_MASK = '********';

const credentialsSchema = z
  .object({
    host: z.string().trim().max(255).optional(),
    port: z.coerce.number().int().min(1).max(65535).optional(),
    secure: z.coerce.boolean().optional(),
    username: z.string().trim().max(255).optional(),
    password: z.string().max(1024).optional(),
    apiKey: z.string().max(1024).optional(),
  })
  .default({});

export const emailProviderConfigSchema = z.object({
  provider: z.enum(EMAIL_PROVIDERS).default('none'),
  fromName: z.string().trim().max(255).default(''),
  fromEmail: z
    .string()
    .trim()
    .max(255)
    .refine((value) => value === '' || z.string().email().safeParse(value).success, {
      message: 'Must be a valid email address.',
    })
    .default(''),
  replyTo: z
    .string()
    .trim()
    .max(255)
    .refine((value) => value === '' || z.string().email().safeParse(value).success, {
      message: 'Must be a valid email address.',
    })
    .default(''),
  credentials: credentialsSchema,
});

export const DEFAULT_EMAIL_PROVIDER_CONFIG: EmailProviderConfig = {
  provider: 'none',
  fromName: '',
  fromEmail: '',
  replyTo: '',
  credentials: {},
};

/**
 * Parse arbitrary stored JSON into a typed config, falling back to sane
 * defaults for missing/legacy fields rather than throwing.
 */
export function parseEmailProviderConfig(value: unknown): EmailProviderConfig {
  const parsed = emailProviderConfigSchema.safeParse(value ?? {});
  if (!parsed.success) {
    return { ...DEFAULT_EMAIL_PROVIDER_CONFIG };
  }
  return {
    provider: parsed.data.provider,
    fromName: parsed.data.fromName,
    fromEmail: parsed.data.fromEmail,
    replyTo: parsed.data.replyTo,
    credentials: parsed.data.credentials ?? {},
  };
}

/**
 * Load + parse the email provider config from the `settings` store.
 * Secrets ARE included — this is for server-side send use only and must never
 * be returned to the client without masking.
 */
export async function getEmailProviderConfig(): Promise<EmailProviderConfig> {
  const row = await prisma.setting.findUnique({
    where: { module_key: { module: EMAIL_SETTING_MODULE, key: EMAIL_SETTING_KEY } },
    select: { value: true },
  });
  return parseEmailProviderConfig(row?.value);
}

export interface SendEmailArgs {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  /** Override the configured sender display name. */
  fromName?: string;
  /** Override the configured sender address. */
  fromEmail?: string;
  /** Override the configured reply-to address. */
  replyTo?: string;
}

export interface SendEmailResult {
  /** Provider that handled (or would have handled) the send. */
  provider: EmailProviderId;
  /** Number of resolved recipients. */
  recipients: number;
  /** True when a real provider delivered; false for the no-op fallback. */
  delivered: boolean;
  /** Human-readable note about what happened. */
  detail: string;
}

function normalizeRecipients(to: string | string[]): string[] {
  const list = Array.isArray(to) ? to : [to];
  return list.map((address) => address.trim()).filter((address) => address.length > 0);
}

function formatFrom(config: EmailProviderConfig, args: SendEmailArgs): string {
  const name = (args.fromName ?? config.fromName).trim();
  const address = (args.fromEmail ?? config.fromEmail).trim();
  if (name && address) return `${name} <${address}>`;
  return address;
}

/**
 * No-op fallback: log the intent and resolve successfully without fabricating
 * delivery. Used when no provider is configured or credentials are missing.
 */
function noopSend(provider: EmailProviderId, recipients: string[], reason: string): SendEmailResult {
  console.info(`[email] would send to ${recipients.length} recipients via ${provider} (${reason})`);
  return {
    provider,
    recipients: recipients.length,
    delivered: false,
    detail: `No delivery performed: ${reason}.`,
  };
}

/**
 * Send an email through the configured provider. Provider-agnostic and safe to
 * call without credentials — it falls back to a logging no-op in that case.
 */
export async function sendEmail(args: SendEmailArgs): Promise<SendEmailResult> {
  const config = await getEmailProviderConfig();
  const recipients = normalizeRecipients(args.to);

  if (recipients.length === 0) {
    return {
      provider: config.provider,
      recipients: 0,
      delivered: false,
      detail: 'No recipients provided.',
    };
  }

  const from = formatFrom(config, args);
  const replyTo = (args.replyTo ?? config.replyTo).trim() || undefined;

  if (config.provider === 'smtp') {
    return sendViaSmtp(config, { recipients, from, replyTo, args });
  }

  if (API_KEY_PROVIDERS.includes(config.provider)) {
    // No SDK wired for API providers yet; only act if a key is present, but be
    // honest that delivery isn't implemented and fall back to the no-op.
    const reason = config.credentials.apiKey
      ? `${config.provider} sending not implemented yet`
      : `${config.provider} apiKey not configured`;
    return noopSend(config.provider, recipients, reason);
  }

  return noopSend(config.provider, recipients, 'no provider configured');
}

async function sendViaSmtp(
  config: EmailProviderConfig,
  ctx: { recipients: string[]; from: string; replyTo?: string; args: SendEmailArgs },
): Promise<SendEmailResult> {
  const { host, port, secure, username, password } = config.credentials;
  if (!host || !ctx.from) {
    return noopSend('smtp', ctx.recipients, 'SMTP host or sender not configured');
  }

  let nodemailer: typeof import('nodemailer');
  try {
    nodemailer = await import('nodemailer');
  } catch {
    return noopSend('smtp', ctx.recipients, 'nodemailer not installed');
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port: port ?? 587,
      secure: secure ?? false,
      auth: username ? { user: username, pass: password ?? '' } : undefined,
    });
    await transporter.sendMail({
      from: ctx.from,
      to: ctx.recipients,
      replyTo: ctx.replyTo,
      subject: ctx.args.subject,
      html: ctx.args.html,
      text: ctx.args.text,
    });
    return {
      provider: 'smtp',
      recipients: ctx.recipients.length,
      delivered: true,
      detail: `Delivered via SMTP (${host}).`,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown error';
    console.error(`[email] SMTP send failed: ${message}`);
    return {
      provider: 'smtp',
      recipients: ctx.recipients.length,
      delivered: false,
      detail: `SMTP send failed: ${message}`,
    };
  }
}
