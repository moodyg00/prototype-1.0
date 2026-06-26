export type BankRuleConditionField =
  | 'counterpartyName'
  | 'description'
  | 'externalCategory'
  | 'transactionType'
  | 'providerKind'
  | 'amount'
  | 'provider';

export type BankRuleConditionOp =
  | 'equals'
  | 'contains'
  | 'startsWith'
  | 'gte'
  | 'lte'
  | 'in';

export type BankRuleCondition = {
  field: BankRuleConditionField;
  op: BankRuleConditionOp;
  value: string | number | string[];
};

export type BankRuleConditions = {
  all?: BankRuleCondition[];
  any?: BankRuleCondition[];
};

export type BankRuleAction = {
  internalCategory: string;
  chartOfAccountCode?: string;
  confidence?: number;
  reason?: string;
  /** When true, generated journal entries must not be auto-posted (human review required). */
  keepJournalDraft?: boolean;
};

export type BankRuleDefinition = {
  ruleName: string;
  priority: number;
  conditions: BankRuleConditions;
  action: BankRuleAction;
  appliesToProvider?: string;
  stopProcessing?: boolean;
};

export type BankRuleEvaluationContext = {
  counterpartyName: string | null;
  description: string | null;
  externalCategory: string | null;
  transactionType: string;
  providerKind: string | null;
  amount: number;
  provider: string | null;
};
