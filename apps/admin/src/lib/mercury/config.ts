/** Chart-of-accounts codes mapped from Mercury account kinds at sync time. */
export const MERCURY_COA_BY_ACCOUNT_KIND = {
  checking: '1000',
  savings: '1010',
} as const;

export const MERCURY_PROVIDER = 'mercury' as const;

export const MERCURY_DEMO_ACCOUNT_ID_PREFIX = 'acct_proto2_';
export const MERCURY_DEMO_TRANSACTION_ID_PREFIX = 'txn_demo_';
export const MERCURY_DEMO_CARD_ID_PREFIX = 'card_';

/** How far back the initial transaction backfill reaches. */
export const MERCURY_TRANSACTION_BACKFILL_START = '2020-01-01';
