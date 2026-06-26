import type {
  MercuryAccount,
  MercuryAccountCardsResponse,
  MercuryAccountsResponse,
  MercuryTransaction,
  MercuryTransactionsResponse,
} from '@/src/lib/mercury/types';
import { getActiveApiIntegration, requireApiKey } from '@/src/lib/integrations/load-integration';

const DEFAULT_BASE_URL = 'https://api.mercury.com/api/v1';

export class MercuryApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly requestId?: string | null,
  ) {
    super(message);
    this.name = 'MercuryApiError';
  }
}

async function getMercuryConfig() {
  const integration = await getActiveApiIntegration('mercury');
  const apiKey = await requireApiKey('mercury', 'Mercury API key');
  const baseUrl = integration?.baseUrl?.trim() || DEFAULT_BASE_URL;
  return { apiKey, baseUrl };
}

async function mercuryFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const { apiKey, baseUrl } = await getMercuryConfig();
  const started = Date.now();
  const url = `${baseUrl}${path}`;
  const response = await fetch(url, {
    ...init,
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${apiKey}`,
      ...(init?.headers ?? {}),
    },
    cache: 'no-store',
  });

  const requestId = response.headers.get('x-request-id');
  const durationMs = Date.now() - started;

  if (!response.ok) {
    let detail = response.statusText;
    try {
      const body = (await response.json()) as { message?: string; error?: string };
      detail = body.message ?? body.error ?? detail;
    } catch {
      // ignore parse errors
    }
    throw new MercuryApiError(
      `Mercury API ${response.status}: ${detail}`,
      response.status,
      requestId,
    );
  }

  const data = (await response.json()) as T;
  void durationMs;
  return data;
}

export async function listMercuryAccounts(): Promise<MercuryAccount[]> {
  const accounts: MercuryAccount[] = [];
  let cursor: string | undefined;

  do {
    const query = new URLSearchParams({ limit: '1000', order: 'asc' });
    if (cursor) query.set('start_after', cursor);

    const page = await mercuryFetch<MercuryAccountsResponse>(`/accounts?${query.toString()}`);
    const batch = page.accounts ?? [];
    accounts.push(...batch);

    const next = page.page?.nextPage ?? null;
    if (!next || batch.length === 0) break;
    cursor = next;
  } while (cursor);

  return accounts;
}

type ListAccountTransactionsOptions = {
  start?: string;
  end?: string;
  limit?: number;
};

export async function listMercuryAccountTransactions(
  accountId: string,
  options: ListAccountTransactionsOptions = {},
): Promise<MercuryTransaction[]> {
  const transactions: MercuryTransaction[] = [];
  const limit = options.limit ?? 1000;
  let offset = 0;
  let total = Number.POSITIVE_INFINITY;

  while (offset < total) {
    const query = new URLSearchParams({
      limit: String(limit),
      offset: String(offset),
      order: 'desc',
    });
    if (options.start) query.set('start', options.start);
    if (options.end) query.set('end', options.end);

    const page = await mercuryFetch<MercuryTransactionsResponse>(
      `/account/${accountId}/transactions?${query.toString()}`,
    );

    const batch = page.transactions ?? [];
    transactions.push(...batch);
    total = page.total ?? batch.length;
    offset += batch.length;

    if (batch.length === 0) break;
  }

  return transactions;
}

export async function listMercuryAccountCards(accountId: string) {
  const page = await mercuryFetch<MercuryAccountCardsResponse>(`/account/${accountId}/cards`);
  return page.cards ?? [];
}

export async function getMercuryTransaction(transactionId: string): Promise<MercuryTransaction> {
  return mercuryFetch<MercuryTransaction>(`/transaction/${transactionId}`);
}
