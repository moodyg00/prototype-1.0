import { syncMercuryBankDataIncremental } from '@prototype/accounting';

export type JobResult = {
  ok: boolean;
  job: string;
  detail?: unknown;
  error?: string;
};

export async function runBankSyncJob(): Promise<JobResult> {
  try {
    const result = await syncMercuryBankDataIncremental();
    return { ok: true, job: 'bank-sync', detail: result };
  } catch (error) {
    return {
      ok: false,
      job: 'bank-sync',
      error: error instanceof Error ? error.message : 'Bank sync failed.',
    };
  }
}

export const jobHandlers: Record<string, () => Promise<JobResult>> = {
  'bank-sync': runBankSyncJob,
};