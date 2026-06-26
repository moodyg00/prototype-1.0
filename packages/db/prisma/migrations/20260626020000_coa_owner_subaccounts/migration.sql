-- Chart of accounts hierarchy + owner equity sub-accounts for Grant and John.

ALTER TABLE chart_of_accounts ADD COLUMN IF NOT EXISTS parent_id UUID;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chart_of_accounts_parent_id_fkey'
  ) THEN
    ALTER TABLE chart_of_accounts
      ADD CONSTRAINT chart_of_accounts_parent_id_fkey
      FOREIGN KEY (parent_id) REFERENCES chart_of_accounts(id) ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS chart_of_accounts_parent_id_idx ON chart_of_accounts(parent_id);

INSERT INTO chart_of_accounts (id, code, name, type, sub_type, description, parent_id, is_active, created_by, updated_by)
VALUES
  (
    'f0000000-0000-4000-8000-000000000055',
    '3010',
    'Owner''s Capital - Grant',
    'equity',
    'equity',
    'Capital contributions by Grant.',
    'f0000000-0000-4000-8000-000000000022',
    true,
    '11111111-1111-4111-8111-111111111111',
    '11111111-1111-4111-8111-111111111111'
  ),
  (
    'f0000000-0000-4000-8000-000000000056',
    '3020',
    'Owner''s Capital - John',
    'equity',
    'equity',
    'Capital contributions by John.',
    'f0000000-0000-4000-8000-000000000022',
    true,
    '11111111-1111-4111-8111-111111111111',
    '11111111-1111-4111-8111-111111111111'
  ),
  (
    'f0000000-0000-4000-8000-000000000057',
    '3110',
    'Owner''s Draws - Grant',
    'equity',
    'contra_equity',
    'Withdrawals and distributions by Grant.',
    'f0000000-0000-4000-8000-000000000023',
    true,
    '11111111-1111-4111-8111-111111111111',
    '11111111-1111-4111-8111-111111111111'
  ),
  (
    'f0000000-0000-4000-8000-000000000058',
    '3120',
    'Owner''s Draws - John',
    'equity',
    'contra_equity',
    'Withdrawals and distributions by John.',
    'f0000000-0000-4000-8000-000000000023',
    true,
    '11111111-1111-4111-8111-111111111111',
    '11111111-1111-4111-8111-111111111111'
  )
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  type = EXCLUDED.type,
  sub_type = EXCLUDED.sub_type,
  description = EXCLUDED.description,
  parent_id = EXCLUDED.parent_id,
  is_active = EXCLUDED.is_active,
  updated_at = CURRENT_TIMESTAMP;
