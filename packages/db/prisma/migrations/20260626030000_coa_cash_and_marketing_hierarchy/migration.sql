-- Cash parent (1000) with bank sub-accounts, plus marketing channel sub-accounts.

-- Move Operating Cash to 1001 so 1000 can be the Cash header (same UUID — bank links unchanged).
UPDATE chart_of_accounts
   SET code = '1001',
       name = 'Operating Cash',
       updated_at = CURRENT_TIMESTAMP
 WHERE code = '1000'
   AND name = 'Operating Cash';

INSERT INTO chart_of_accounts (id, code, name, type, sub_type, description, is_active, created_by, updated_by)
VALUES (
  'f0000000-0000-4000-8000-000000000059',
  '1000',
  'Cash',
  'asset',
  'bank',
  'Combined cash and bank balances.',
  true,
  '11111111-1111-4111-8111-111111111111',
  '11111111-1111-4111-8111-111111111111'
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  type = EXCLUDED.type,
  sub_type = EXCLUDED.sub_type,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active,
  updated_at = CURRENT_TIMESTAMP;

UPDATE chart_of_accounts
   SET parent_id = 'f0000000-0000-4000-8000-000000000059',
       updated_at = CURRENT_TIMESTAMP
 WHERE code IN ('1001', '1010', '1020');

UPDATE chart_of_accounts
   SET name = 'Marketing Expense',
       description = 'Paid media and campaign spend (rollup of channel sub-accounts).',
       updated_at = CURRENT_TIMESTAMP
 WHERE code = '5300';

INSERT INTO chart_of_accounts (id, code, name, type, sub_type, description, parent_id, is_active, created_by, updated_by)
VALUES
  (
    'f0000000-0000-4000-8000-00000000005a',
    '5310',
    'Marketing - Paid Search',
    'expense',
    'operating_expense',
    'Google Ads and other paid search spend.',
    (SELECT id FROM chart_of_accounts WHERE code = '5300'),
    true,
    '11111111-1111-4111-8111-111111111111',
    '11111111-1111-4111-8111-111111111111'
  ),
  (
    'f0000000-0000-4000-8000-00000000005b',
    '5320',
    'Marketing - Paid Social',
    'expense',
    'operating_expense',
    'Meta, LinkedIn, and other paid social spend.',
    (SELECT id FROM chart_of_accounts WHERE code = '5300'),
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
