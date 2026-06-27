/** Categories whose journal entries must remain Draft until a human posts them. */
export const JOURNAL_ALWAYS_DRAFT_CATEGORIES = new Set(['owner_capital']);

export function journalMustStayDraft(internalCategory: string | null | undefined): boolean {
  return Boolean(internalCategory && JOURNAL_ALWAYS_DRAFT_CATEGORIES.has(internalCategory));
}
