#!/usr/bin/env node
/**
 * Import legacy integration secrets from .env.local into the database.
 * Safe to re-run: only fills missing DB values, never overwrites existing secrets.
 */
import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import { Client } from 'pg';

const envPaths = [
  path.resolve(process.cwd(), '.env.local'),
  path.resolve(process.cwd(), '.env'),
];

for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    break;
  }
}

const connectionString =
  process.env.DATABASE_URL ?? process.env.SUPABASE_DB_URL ?? process.env.SUPABASE_POOLER_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is required to bootstrap integrations.');
}

function env(name) {
  const value = process.env[name]?.trim();
  return value || null;
}

async function upsertIntegration(client, args) {
  const incoming = Boolean(
    args.apiKey || args.webhookSecret || args.apiSecret || args.baseUrl || args.docsUrl,
  );
  if (!incoming) return 'skipped';

  const existing = await client.query(
    `SELECT id, api_key, webhook_secret, api_secret, base_url, docs_url
     FROM integrations WHERE type = 'api' AND provider = $1
     ORDER BY created_at ASC LIMIT 1`,
    [args.provider],
  );
  const row = existing.rows[0];

  const apiKey = row?.api_key?.trim() || args.apiKey || null;
  const webhookSecret = row?.webhook_secret?.trim() || args.webhookSecret || null;
  const apiSecret = row?.api_secret?.trim() || args.apiSecret || null;
  const baseUrl = row?.base_url?.trim() || args.baseUrl || null;
  const docsUrl = row?.docs_url?.trim() || args.docsUrl || null;

  if (!row) {
    await client.query(
      `INSERT INTO integrations (
         name, type, provider, status, environment, auth_type,
         base_url, docs_url, api_key, api_secret, webhook_secret
       ) VALUES ($1, 'api', $2, 'active', 'production', 'api_key', $3, $4, $5, $6, $7)`,
      [args.name, args.provider, baseUrl, docsUrl, apiKey, apiSecret, webhookSecret],
    );
    return 'created';
  }

  const changed =
    (!row.api_key?.trim() && apiKey) ||
    (!row.webhook_secret?.trim() && webhookSecret) ||
    (!row.api_secret?.trim() && apiSecret) ||
    (!row.base_url?.trim() && baseUrl) ||
    (!row.docs_url?.trim() && docsUrl);

  if (!changed) return 'skipped';

  await client.query(
    `UPDATE integrations
     SET base_url = COALESCE(NULLIF(base_url, ''), $2),
         docs_url = COALESCE(NULLIF(docs_url, ''), $3),
         api_key = COALESCE(NULLIF(api_key, ''), $4),
         api_secret = COALESCE(NULLIF(api_secret, ''), $5),
         webhook_secret = COALESCE(NULLIF(webhook_secret, ''), $6),
         updated_at = NOW()
     WHERE id = $1`,
    [row.id, baseUrl, docsUrl, apiKey, apiSecret, webhookSecret],
  );
  return 'updated';
}

async function upsertSystemSetting(client, key, incomingValue, description, isSensitive) {
  if (!incomingValue) return 'skipped';

  const existing = await client.query(
    `SELECT id, value FROM settings WHERE module = 'system' AND key = $1`,
    [key],
  );
  const row = existing.rows[0];

  if (!row) {
    await client.query(
      `INSERT INTO settings (module, key, value, description, is_sensitive)
       VALUES ('system', $1, $2::jsonb, $3, $4)`,
      [key, JSON.stringify(incomingValue), description, isSensitive],
    );
    return 'created';
  }

  const current = row.value ?? {};
  const shouldUpdate =
    (incomingValue.secret && !current.secret) || (incomingValue.url && !current.url);

  if (!shouldUpdate) return 'skipped';

  const next = {
    ...current,
    ...(incomingValue.secret && !current.secret ? { secret: incomingValue.secret } : {}),
    ...(incomingValue.url && !current.url ? { url: incomingValue.url } : {}),
  };

  await client.query(`UPDATE settings SET value = $2::jsonb, updated_at = NOW() WHERE id = $1`, [
    row.id,
    JSON.stringify(next),
  ]);
  return 'updated';
}

async function upsertEmailProvider(client) {
  const providerFromEnv = env('EMAIL_PROVIDER');
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

  const existing = await client.query(
    `SELECT id, value FROM settings WHERE module = 'email' AND key = 'provider'`,
  );
  const row = existing.rows[0];
  const current = row?.value ?? {
    provider: 'none',
    fromName: '',
    fromEmail: '',
    replyTo: '',
    credentials: {},
  };
  const credentials = { ...(current.credentials ?? {}) };

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

  let provider = current.provider ?? 'none';
  if (provider === 'none' && providerFromEnv && providerFromEnv !== 'none') {
    provider = providerFromEnv;
  } else if (provider === 'none' && credentials.host?.trim()) {
    provider = 'smtp';
  } else if (provider === 'none' && credentials.apiKey?.trim()) {
    if (resendKey) provider = 'resend';
    else if (sendgridKey) provider = 'sendgrid';
    else if (postmarkKey) provider = 'postmark';
  }

  const merged = {
    provider,
    fromName: (current.fromName ?? '').trim() || fromName || '',
    fromEmail: (current.fromEmail ?? '').trim() || fromEmail || '',
    replyTo: (current.replyTo ?? '').trim() || replyTo || '',
    credentials,
  };

  if (JSON.stringify(current) === JSON.stringify(merged)) return 'skipped';

  if (!row) {
    await client.query(
      `INSERT INTO settings (module, key, value, description, is_sensitive)
       VALUES ('email', 'provider', $1::jsonb, $2, true)`,
      [JSON.stringify(merged), 'Email provider configuration (sender identity + credentials).'],
    );
    return 'created';
  }

  await client.query(`UPDATE settings SET value = $2::jsonb, is_sensitive = true, updated_at = NOW() WHERE id = $1`, [
    row.id,
    JSON.stringify(merged),
  ]);
  return 'updated';
}

const client = new Client({
  connectionString,
  ssl: connectionString.includes('supabase') ? { rejectUnauthorized: false } : undefined,
});

await client.connect();

const result = {
  mercury: await upsertIntegration(client, {
    provider: 'mercury',
    name: 'Mercury',
    baseUrl: env('MERCURY_API_BASE_URL') ?? 'https://api.mercury.com/api/v1',
    docsUrl: 'https://docs.mercury.com',
    apiKey: env('MERCURY_API_KEY'),
    webhookSecret: env('MERCURY_WEBHOOK_SECRET'),
  }),
  openai: await upsertIntegration(client, {
    provider: 'openai',
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    docsUrl: 'https://platform.openai.com/docs',
    apiKey: env('OPENAI_API_KEY'),
  }),
  tencent: await upsertIntegration(client, {
    provider: 'tencent',
    name: 'Tencent Memory',
    baseUrl: env('TENCENT_BASE_URL'),
    apiKey: env('TENCENT_API_KEY'),
  }),
  cron: await upsertSystemSetting(
    client,
    'cron',
    env('CRON_SECRET') ? { secret: env('CRON_SECRET') } : null,
    'Bearer token for /api/cron/* routes.',
    true,
  ),
  appUrl: await upsertSystemSetting(
    client,
    'app',
    env('NEXT_PUBLIC_APP_URL') ? { url: env('NEXT_PUBLIC_APP_URL') } : null,
    'Public app base URL for webhooks and shareable links.',
    false,
  ),
  email: await upsertEmailProvider(client),
};

await client.end();
console.log('Integration bootstrap complete:', result);
