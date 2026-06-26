import { Prisma } from '@prototype/db';

import {
  EMAIL_PROVIDERS,
  EMAIL_SETTING_KEY,
  EMAIL_SETTING_MODULE,
  getEmailProviderConfig,
  type EmailProviderConfig,
  type EmailProviderId,
} from '@/src/lib/email/provider';
import { prisma } from '@/src/lib/prisma';

type BootstrapResult = {
  mercury: 'created' | 'updated' | 'skipped';
  openai: 'created' | 'updated' | 'skipped';
  tencent: 'created' | 'updated' | 'skipped';
  cron: 'created' | 'updated' | 'skipped';
  appUrl: 'created' | 'updated' | 'skipped';
  email: 'created' | 'updated' | 'skipped';
};

function env(name: string): string | null {
  const value = process.env[name]?.trim();
  return value || null;
}

async function upsertApiIntegration(args: {
  provider: string;
  name: string;
  baseUrl?: string | null;
  docsUrl?: string | null;
  apiKey?: string | null;
  apiSecret?: string | null;
  webhookSecret?: string | null;
  publicKey?: string | null;
}): Promise<'created' | 'updated' | 'skipped'> {
  const hasIncoming = Boolean(
    args.apiKey || args.apiSecret || args.webhookSecret || args.publicKey || args.baseUrl || args.docsUrl,
  );
  if (!hasIncoming) return 'skipped';

  const existing = await prisma.integration.findFirst({
    where: { type: 'api', provider: args.provider },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      apiKey: true,
      apiSecret: true,
      webhookSecret: true,
      publicKey: true,
      baseUrl: true,
      docsUrl: true,
    },
  });

  const data = {
    name: args.name,
    type: 'api' as const,
    provider: args.provider,
    status: 'active' as const,
    environment: 'production' as const,
    authType: 'api_key' as const,
    baseUrl: args.baseUrl ?? existing?.baseUrl ?? null,
    docsUrl: args.docsUrl ?? existing?.docsUrl ?? null,
    apiKey: existing?.apiKey?.trim() || args.apiKey || null,
    apiSecret: existing?.apiSecret?.trim() || args.apiSecret || null,
    webhookSecret: existing?.webhookSecret?.trim() || args.webhookSecret || null,
    publicKey: existing?.publicKey?.trim() || args.publicKey || null,
  };

  if (!existing) {
    await prisma.integration.create({ data });
    return 'created';
  }

  const changed =
    (!existing.baseUrl && data.baseUrl) ||
    (!existing.docsUrl && data.docsUrl) ||
    (!existing.apiKey?.trim() && data.apiKey) ||
    (!existing.apiSecret?.trim() && data.apiSecret) ||
    (!existing.webhookSecret?.trim() && data.webhookSecret) ||
    (!existing.publicKey?.trim() && data.publicKey);

  if (!changed) return 'skipped';

  await prisma.integration.update({ where: { id: existing.id }, data });
  return 'updated';
}

async function upsertSystemSetting(args: {
  key: string;
  value: Prisma.InputJsonValue;
  description: string;
  isSensitive?: boolean;
  incomingPresent: boolean;
}): Promise<'created' | 'updated' | 'skipped'> {
  if (!args.incomingPresent) return 'skipped';

  const existing = await prisma.setting.findUnique({
    where: { module_key: { module: 'system', key: args.key } },
    select: { id: true, value: true },
  });

  if (!existing) {
    await prisma.setting.create({
      data: {
        module: 'system',
        key: args.key,
        value: args.value,
        description: args.description,
        isSensitive: args.isSensitive ?? false,
      },
    });
    return 'created';
  }

  const current = existing.value as Record<string, unknown>;
  const next = args.value as Record<string, unknown>;
  const currentSecret = typeof current.secret === 'string' ? current.secret.trim() : '';
  const nextSecret = typeof next.secret === 'string' ? next.secret.trim() : '';
  const currentUrl = typeof current.url === 'string' ? current.url.trim() : '';
  const nextUrl = typeof next.url === 'string' ? next.url.trim() : '';

  const shouldUpdate =
    (nextSecret && !currentSecret) || (nextUrl && !currentUrl && nextUrl !== currentUrl);

  if (!shouldUpdate) return 'skipped';

  await prisma.setting.update({
    where: { id: existing.id },
    data: {
      value: {
        ...current,
        ...(nextSecret && !currentSecret ? { secret: nextSecret } : {}),
        ...(nextUrl && !currentUrl ? { url: nextUrl } : {}),
      } as Prisma.InputJsonValue,
      isSensitive: args.isSensitive ?? false,
    },
  });
  return 'updated';
}

function parseEmailProvider(value: string | null): EmailProviderId | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  return (EMAIL_PROVIDERS as readonly string[]).includes(normalized)
    ? (normalized as EmailProviderId)
    : null;
}

function emailConfigChanged(before: EmailProviderConfig, after: EmailProviderConfig): boolean {
  return JSON.stringify(before) !== JSON.stringify(after);
}

async function upsertEmailProviderFromEnv(): Promise<'created' | 'updated' | 'skipped'> {
  const providerFromEnv = parseEmailProvider(env('EMAIL_PROVIDER'));
  const fromName = env('MAIL_FROM_NAME');
  const fromEmail = env('MAIL_FROM_EMAIL');
  const replyTo = env('MAIL_REPLY_TO');
  const smtpHost = env('SMTP_HOST');
  const smtpPort = env('SMTP_PORT');
  const smtpSecure = env('SMTP_SECURE');
  const smtpUser = env('SMTP_USERNAME');
  const smtpPass = env('SMTP_PASSWORD');
  const resendKey = env('RESEND_API_KEY');
  const sendgridKey = env('SENDGRID_API_KEY');
  const postmarkKey = env('POSTMARK_API_KEY');

  const hasIncoming = Boolean(
    providerFromEnv ||
      fromName ||
      fromEmail ||
      replyTo ||
      smtpHost ||
      smtpPort ||
      smtpSecure ||
      smtpUser ||
      smtpPass ||
      resendKey ||
      sendgridKey ||
      postmarkKey,
  );
  if (!hasIncoming) return 'skipped';

  const existingRow = await prisma.setting.findUnique({
    where: { module_key: { module: EMAIL_SETTING_MODULE, key: EMAIL_SETTING_KEY } },
    select: { id: true },
  });
  const existing = await getEmailProviderConfig();

  const credentials = { ...existing.credentials };
  if (!credentials.host?.trim() && smtpHost) credentials.host = smtpHost;
  if (!credentials.port && smtpPort) {
    const port = Number(smtpPort);
    if (Number.isInteger(port) && port >= 1 && port <= 65535) credentials.port = port;
  }
  if (credentials.secure === undefined && smtpSecure) {
    credentials.secure = smtpSecure === 'true' || smtpSecure === '1';
  }
  if (!credentials.username?.trim() && smtpUser) credentials.username = smtpUser;
  if (!credentials.password?.trim() && smtpPass) credentials.password = smtpPass;
  if (!credentials.apiKey?.trim()) {
    if (resendKey) credentials.apiKey = resendKey;
    else if (sendgridKey) credentials.apiKey = sendgridKey;
    else if (postmarkKey) credentials.apiKey = postmarkKey;
  }

  let provider = existing.provider;
  if (provider === 'none' && providerFromEnv && providerFromEnv !== 'none') {
    provider = providerFromEnv;
  } else if (provider === 'none' && credentials.host?.trim()) {
    provider = 'smtp';
  } else if (provider === 'none' && credentials.apiKey?.trim()) {
    if (resendKey) provider = 'resend';
    else if (sendgridKey) provider = 'sendgrid';
    else if (postmarkKey) provider = 'postmark';
  }

  const merged: EmailProviderConfig = {
    provider,
    fromName: existing.fromName.trim() || fromName || '',
    fromEmail: existing.fromEmail.trim() || fromEmail || '',
    replyTo: existing.replyTo.trim() || replyTo || '',
    credentials,
  };

  if (!emailConfigChanged(existing, merged)) return 'skipped';

  await prisma.setting.upsert({
    where: { module_key: { module: EMAIL_SETTING_MODULE, key: EMAIL_SETTING_KEY } },
    create: {
      module: EMAIL_SETTING_MODULE,
      key: EMAIL_SETTING_KEY,
      value: merged as unknown as Prisma.InputJsonValue,
      description: 'Email provider configuration (sender identity + credentials).',
      isSensitive: true,
    },
    update: {
      value: merged as unknown as Prisma.InputJsonValue,
      isSensitive: true,
    },
  });

  return existingRow ? 'updated' : 'created';
}

/** One-time import from legacy .env values. Never overwrites secrets already stored in the DB. */
export async function bootstrapIntegrationsFromEnv(): Promise<BootstrapResult> {
  const mercury = await upsertApiIntegration({
    provider: 'mercury',
    name: 'Mercury',
    baseUrl: env('MERCURY_API_BASE_URL') ?? 'https://api.mercury.com/api/v1',
    docsUrl: 'https://docs.mercury.com',
    apiKey: env('MERCURY_API_KEY'),
    webhookSecret: env('MERCURY_WEBHOOK_SECRET'),
  });

  const openai = await upsertApiIntegration({
    provider: 'openai',
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    docsUrl: 'https://platform.openai.com/docs',
    apiKey: env('OPENAI_API_KEY'),
  });

  const tencent = await upsertApiIntegration({
    provider: 'tencent',
    name: 'Tencent Memory',
    baseUrl: env('TENCENT_BASE_URL'),
    apiKey: env('TENCENT_API_KEY'),
  });

  const cronSecret = env('CRON_SECRET');
  const cron = await upsertSystemSetting({
    key: 'cron',
    value: { secret: cronSecret ?? '' },
    description: 'Bearer token for /api/cron/* routes.',
    isSensitive: true,
    incomingPresent: Boolean(cronSecret),
  });

  const appUrl = env('NEXT_PUBLIC_APP_URL');
  const appUrlResult = await upsertSystemSetting({
    key: 'app',
    value: { url: appUrl ?? '' },
    description: 'Public app base URL for webhooks, booking links, and shareable URLs.',
    incomingPresent: Boolean(appUrl),
  });

  const email = await upsertEmailProviderFromEnv();

  return {
    mercury,
    openai,
    tencent,
    cron,
    appUrl: appUrlResult,
    email,
  };
}
