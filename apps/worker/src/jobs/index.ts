import { workerConfig } from '../config.js';

export type JobResult = {
  ok: boolean;
  job: string;
  detail?: unknown;
  error?: string;
};

export async function runBankSyncJob(): Promise<JobResult> {
  const { adminBaseUrl, cronSecret } = workerConfig;
  if (!cronSecret) {
    return { ok: false, job: 'bank-sync', error: 'CRON_SECRET is not configured.' };
  }

  const url = `${adminBaseUrl}/api/cron/bank-sync`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${cronSecret}`,
      'Content-Type': 'application/json',
    },
  });

  const detail = await response.json().catch(() => null);
  if (!response.ok) {
    return {
      ok: false,
      job: 'bank-sync',
      error: typeof detail?.error === 'string' ? detail.error : `HTTP ${response.status}`,
      detail,
    };
  }

  return { ok: true, job: 'bank-sync', detail };
}

export const jobHandlers: Record<string, () => Promise<JobResult>> = {
  'bank-sync': runBankSyncJob,
};
