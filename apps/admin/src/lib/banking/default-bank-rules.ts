import { MERCURY_PROVIDER } from '@/src/lib/mercury/config';
import type { BankRuleDefinition } from '@/src/lib/banking/bank-rule-types';

export const DEFAULT_BANK_RULES: BankRuleDefinition[] = [
  {
    ruleName: 'Internal Mercury transfer',
    priority: 10,
    appliesToProvider: MERCURY_PROVIDER,
    conditions: {
      any: [
        { field: 'providerKind', op: 'equals', value: 'internalTransfer' },
        { field: 'transactionType', op: 'in', value: ['transfer_in', 'transfer_out'] },
      ],
    },
    action: {
      internalCategory: 'internal_transfer',
      confidence: 98,
      reason: 'Matched internal account transfer.',
    },
  },
  {
    ruleName: 'Stripe payout deposit',
    priority: 20,
    appliesToProvider: MERCURY_PROVIDER,
    conditions: {
      all: [
        { field: 'amount', op: 'gte', value: 0 },
        {
          field: 'counterpartyName',
          op: 'contains',
          value: 'stripe',
        },
      ],
    },
    action: {
      internalCategory: 'merchant_clearing',
      chartOfAccountCode: '1200',
      confidence: 95,
      reason: 'Stripe payout to operating cash.',
    },
  },
  {
    ruleName: 'Software and subscriptions',
    priority: 30,
    appliesToProvider: MERCURY_PROVIDER,
    conditions: {
      any: [
        { field: 'externalCategory', op: 'contains', value: 'Software' },
        { field: 'externalCategory', op: 'contains', value: 'Subscription' },
      ],
    },
    action: {
      internalCategory: 'software_subscriptions',
      chartOfAccountCode: '5200',
      confidence: 92,
      reason: 'Software or subscription spend.',
    },
  },
  {
    ruleName: 'Marketing and advertising',
    priority: 40,
    appliesToProvider: MERCURY_PROVIDER,
    conditions: {
      any: [
        { field: 'externalCategory', op: 'contains', value: 'Marketing' },
        { field: 'externalCategory', op: 'contains', value: 'Advertising' },
      ],
    },
    action: {
      internalCategory: 'marketing_expense',
      chartOfAccountCode: '5300',
      confidence: 90,
      reason: 'Marketing or advertising spend.',
    },
  },
  {
    ruleName: 'Legal and professional services',
    priority: 50,
    appliesToProvider: MERCURY_PROVIDER,
    conditions: {
      any: [
        { field: 'externalCategory', op: 'contains', value: 'Legal' },
        { field: 'externalCategory', op: 'contains', value: 'Professional' },
      ],
    },
    action: {
      internalCategory: 'professional_fees',
      chartOfAccountCode: '6850',
      confidence: 88,
      reason: 'Legal or professional services.',
    },
  },
  {
    ruleName: 'Travel and transportation',
    priority: 60,
    appliesToProvider: MERCURY_PROVIDER,
    conditions: {
      any: [
        { field: 'externalCategory', op: 'contains', value: 'Travel' },
        { field: 'externalCategory', op: 'contains', value: 'Transportation' },
        { field: 'externalCategory', op: 'contains', value: 'CarRental' },
      ],
    },
    action: {
      internalCategory: 'travel',
      chartOfAccountCode: '6650',
      confidence: 85,
      reason: 'Travel or transportation expense.',
    },
  },
  {
    ruleName: 'Cash App owner capital deposit',
    priority: 65,
    appliesToProvider: MERCURY_PROVIDER,
    conditions: {
      all: [{ field: 'amount', op: 'gte', value: 0 }],
      any: [
        { field: 'counterpartyName', op: 'contains', value: 'cash app' },
        { field: 'description', op: 'contains', value: 'cash app' },
      ],
    },
    action: {
      internalCategory: 'owner_capital',
      chartOfAccountCode: '3000',
      confidence: 85,
      reason: 'Cash App deposit — likely owner capital; review before posting.',
      keepJournalDraft: true,
    },
  },
  {
    ruleName: 'Bank and processing fees',
    priority: 70,
    appliesToProvider: MERCURY_PROVIDER,
    conditions: {
      any: [
        { field: 'externalCategory', op: 'contains', value: 'Fee' },
        { field: 'transactionType', op: 'equals', value: 'fee' },
        { field: 'providerKind', op: 'contains', value: 'fee' },
      ],
    },
    action: {
      internalCategory: 'bank_fees',
      chartOfAccountCode: '6050',
      confidence: 84,
      reason: 'Bank or processing fee.',
    },
  },
  {
    ruleName: 'Interest income',
    priority: 80,
    appliesToProvider: MERCURY_PROVIDER,
    conditions: {
      any: [
        { field: 'transactionType', op: 'equals', value: 'interest' },
        { field: 'providerKind', op: 'contains', value: 'interest' },
      ],
    },
    action: {
      internalCategory: 'interest_income',
      chartOfAccountCode: '8000',
      confidence: 90,
      reason: 'Interest earned on balances.',
    },
  },
  {
    ruleName: 'Retail and miscellaneous purchases',
    priority: 200,
    appliesToProvider: MERCURY_PROVIDER,
    conditions: {
      any: [{ field: 'externalCategory', op: 'contains', value: 'Retail' }],
    },
    action: {
      internalCategory: 'miscellaneous_expense',
      chartOfAccountCode: '7900',
      confidence: 70,
      reason: 'Retail purchase.',
    },
  },
];
