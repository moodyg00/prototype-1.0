import { prisma } from '@/src/lib/prisma';

const SYSTEM_MODULE = 'system';

export async function getSystemSettingValue<T>(key: string): Promise<T | null> {
  const row = await prisma.setting.findUnique({
    where: { module_key: { module: SYSTEM_MODULE, key } },
    select: { value: true },
  });
  return (row?.value as T | undefined) ?? null;
}

export async function getCronSecret(): Promise<string | null> {
  const value = await getSystemSettingValue<{ secret?: string }>('cron');
  const secret = value?.secret?.trim();
  return secret || null;
}

export async function getAppBaseUrl(fallbackOrigin?: string): Promise<string> {
  const value = await getSystemSettingValue<{ url?: string }>('app');
  const fromDb = value?.url?.trim().replace(/\/$/, '');
  if (fromDb) return fromDb;

  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, '');
  if (fromEnv) return fromEnv;

  if (fallbackOrigin) return fallbackOrigin.replace(/\/$/, '');
  return 'http://localhost:3000';
}
