-- Journal entries and work orders now use UUID identifiers; only invoices and
-- estimates keep Postgres sequences (see apps/admin/src/lib/accounting/numbering.ts).

DROP SEQUENCE IF EXISTS document_number_journal_entry_seq;
DROP SEQUENCE IF EXISTS document_number_work_order_seq;
