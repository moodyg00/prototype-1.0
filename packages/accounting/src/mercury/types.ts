export type MercuryAccount = {
  id: string;
  accountNumber: string;
  routingNumber: string;
  name: string;
  status: string;
  type: string;
  kind: string;
  createdAt: string;
  availableBalance: number;
  currentBalance: number;
  legalBusinessName: string;
  dashboardLink: string;
  nickname?: string | null;
  canReceiveTransactions?: boolean | null;
};

export type MercuryAccountsResponse = {
  accounts: MercuryAccount[];
  page?: {
    nextPage?: string | null;
    previousPage?: string | null;
  };
};

export type MercuryCategoryData = {
  id: string;
  name: string;
};

export type MercuryMerchantData = {
  id?: string;
  name?: string;
};

export type MercuryCardSpendLimit = {
  amountCents: number;
  interval: 'daily' | 'weekly' | 'monthly';
  atmAmountCents?: number | null;
};

export type MercuryAccountCard = {
  cardId: string;
  nameOnCard: string;
  lastFourDigits: string;
  network: 'visa' | 'mastercard';
  status: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  type: 'virtual' | 'physical';
  spendLimit: MercuryCardSpendLimit;
  physicalCardStatus?: string | null;
};

export type MercuryAccountCardsResponse = {
  cards: MercuryAccountCard[];
};

export type MercuryTransactionCardInfo = {
  id: string;
};

export type MercuryTransaction = {
  id: string;
  accountId: string;
  amount: number;
  bankDescription?: string | null;
  counterpartyName: string;
  counterpartyId?: string;
  createdAt: string;
  dashboardLink: string;
  kind: string;
  status: string;
  postedAt?: string | null;
  externalMemo?: string | null;
  note?: string | null;
  requestId?: string | null;
  categoryData?: MercuryCategoryData | null;
  mercuryCategory?: string | null;
  merchant?: MercuryMerchantData | null;
  details?: {
    debitCardInfo?: MercuryTransactionCardInfo | null;
    creditCardInfo?: MercuryTransactionCardInfo | null;
  } | null;
};

export type MercuryTransactionsResponse = {
  total: number;
  transactions: MercuryTransaction[];
};

export type MercuryWebhookEvent = {
  id: string;
  resourceType: string;
  resourceId: string;
  operationType: string;
  resourceVersion?: number;
  occurredAt: string;
  changedPaths?: string[];
  mergePatch?: Record<string, unknown>;
  previousValues?: Record<string, unknown>;
};
