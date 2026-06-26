-- Shared Postgres sequences for document numbering (see apps/admin/src/lib/accounting/numbering.ts).

CREATE SEQUENCE IF NOT EXISTS document_number_journal_entry_seq;
CREATE SEQUENCE IF NOT EXISTS document_number_invoice_seq;
CREATE SEQUENCE IF NOT EXISTS document_number_estimate_seq;
CREATE SEQUENCE IF NOT EXISTS document_number_work_order_seq;

DO $$
DECLARE
  max_val BIGINT;
BEGIN
  SELECT COALESCE(MAX(CAST(REGEXP_REPLACE(entry_number, '^JE-', '') AS BIGINT)), 0)
    INTO max_val
    FROM journal_entries
   WHERE entry_number ~ '^JE-[0-9]+$';
  PERFORM setval('document_number_journal_entry_seq', GREATEST(max_val, 1), max_val > 0);

  SELECT COALESCE(MAX(CAST(REGEXP_REPLACE(invoice_number, '^INV-', '') AS BIGINT)), 0)
    INTO max_val
    FROM invoices
   WHERE invoice_number ~ '^INV-[0-9]+$';
  PERFORM setval('document_number_invoice_seq', GREATEST(max_val, 1), max_val > 0);

  SELECT COALESCE(MAX(CAST(REGEXP_REPLACE(estimate_number, '^EST-', '') AS BIGINT)), 0)
    INTO max_val
    FROM estimates
   WHERE estimate_number ~ '^EST-[0-9]+$';
  PERFORM setval('document_number_estimate_seq', GREATEST(max_val, 1), max_val > 0);

  SELECT COALESCE(MAX(CAST(REGEXP_REPLACE(work_order_number, '^WO-', '') AS BIGINT)), 0)
    INTO max_val
    FROM work_orders
   WHERE work_order_number ~ '^WO-[0-9]+$';
  PERFORM setval('document_number_work_order_seq', GREATEST(max_val, 1), max_val > 0);
END $$;
