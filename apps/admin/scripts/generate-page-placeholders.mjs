#!/usr/bin/env node
/**
 * Generates missing /admin/* placeholder pages from a manifest.
 *
 * Each generated file is intentionally tiny — it imports the shared
 * PagePlaceholder component which carries the layout, title, description,
 * group tag, and Proto-1 source pointer.
 *
 * Running this script is idempotent: existing files are NOT overwritten.
 */

import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const ROOT = resolve(process.cwd());

/**
 * Each entry: [route, title, description, group, source]
 * route is the path under app/admin/<route>/page.tsx
 */
const PAGES = [
  // Main
  ['task-library',       'Tasks',            'Task library and templates.',                                     'Main',                 'app/Filament/Resources/TaskResource.php'],
  ['opportunities',      'Opportunities',    'Open opportunities and pipeline.',                                'Main',                 'app/Filament/Resources/OpportunityResource.php'],
  ['images',             'Images',           'Image library and uploads.',                                      'Main',                 'app/Filament/Pages/MediaPage.php'],
  ['assets',             'Assets',           'Linked asset records.',                                           'Main',                 'app/Filament/Resources/AssetResource.php'],
  ['documents',          'Documents',        'Generated and uploaded documents.',                               'Main',                 'app/Filament/Resources/DocumentResource.php'],

  // Operations
  ['operations-dashboard', 'Operations Dashboard', 'Operational health, dispatch, and queue overview.',         'Operations',           'app/Filament/Pages/OperationsDashboard.php'],
  ['work-orders',          'Work Orders',          'Field work orders.',                                         'Operations',           'app/Filament/Resources/JobResource.php'],
  ['calendar',             'Schedule',             'Calendar of scheduled work.',                                'Operations',           'app/Filament/Resources/SchedulingResource.php'],
  ['calendar/availability', 'Availability',        'Crew/resource availability windows.',                        'Operations',           'app/Filament/Resources/SchedulingResource (availability page)'],
  ['calendar/booking-links','Booking Links',         'Shareable booking links for customers.',                     'Operations',           'app/Filament/Resources/SchedulingResource (booking links page)'],
  ['estimates',           'Estimates',            'Estimates and quotes.',                                      'Operations',           'app/Filament/Resources/EstimateResource.php'],
  ['catalog',             'Catalog',              'Inventory and product catalog.',                             'Operations',           'app/Filament/Resources/CatalogResource.php'],
  ['offerings',           'Offerings',            'Service offerings and packages.',                            'Operations',           'app/Filament/Resources/OfferingResource.php'],
  ['invoices',            'Invoices',             'Customer invoices.',                                         'Banking',              'app/Filament/Resources/InvoiceResource.php'],

  // Customer Relations
  ['crm-dashboard',       'CRM Dashboard',        'CRM activity, follow-ups, and pipeline.',                    'Customer Relations',   'app/Filament/Pages/CrmDashboard.php'],
  ['mail',                'Mail',                 'Mail and outreach inbox.',                                   'Customer Relations',   'app/Filament/Resources/MailResource.php'],

  // Accounting
  ['accounting-dashboard','Accounting Dashboard', 'Cash, A/R, A/P, and trial balance snapshot.',                'Accounting',           'app/Filament/Pages/AccountingDashboard.php'],
  ['chart-of-accounts',   'Chart of Accounts',    'GL account hierarchy.',                                      'Accounting',           'app/Filament/Resources/ChartOfAccountResource.php'],
  ['journal-entries',     'Journal Entries',      'GL journal entries (manual + automated).',                   'Accounting',           'app/Filament/Resources/JournalEntryResource.php'],
  ['balances',            'Balances',             'Period-end balances per account.',                           'Accounting',           'app/Filament/Resources/BalanceResource.php'],
  ['payments',            'Payments',             'Customer and vendor payments.',                              'Accounting',           'app/Filament/Resources/PaymentResource.php'],
  ['recurring-invoices',  'Recurring Invoices',   'Subscription and retainer invoice schedules.',               'Banking',              'app/Filament/Resources/RecurringInvoiceResource.php'],
  ['accounting-reports',  'Reports',              'P&L, balance sheet, cash flow, tax.',                        'Accounting',           'app/Filament/Pages/AccountingReport.php'],

  // Banking
  ['bank-accounts',       'Bank Accounts',        'Connected bank/credit accounts.',                            'Banking',              'app/Filament/Resources/BankAccountResource.php'],
  ['bank-transactions',   'Transactions',         'Bank transactions and categorization.',                      'Banking',              'app/Filament/Resources/BankTransactionResource.php'],
  ['bank-cards',          'Cards',                'Issued / linked cards.',                                     'Banking',              'app/Filament/Resources/BankCardResource.php'],
  ['bills',               'Bills',                'A/P bills.',                                                 'Banking',              'app/Filament/Resources/BillResource.php'],

  // Marketing & Ads
  ['marketing-dashboard', 'Marketing Dashboard',  'Campaign performance and channel mix.',                      'Marketing & Ads',      'app/Filament/Pages/MarketingDashboard.php'],
  ['ads',                 'Ads',                  'Active ad creatives across channels.',                       'Marketing & Ads',      'app/Filament/Resources/AdResource.php'],
  ['campaigns',           'Campaigns',            'Campaign planning and orchestration.',                       'Marketing & Ads',      'app/Filament/Resources/CampaignResource.php'],
  ['design-studio',       'Design Studio',        'Design assets and creative workflows.',                      'Marketing & Ads',      'app/Filament/Resources/DesignStudioResource.php'],

  // Content & Blog
  ['content-dashboard',   'Content Dashboard',    'Content velocity and publishing queue.',                     'Content & Blog',       'app/Filament/Pages/ContentDashboard.php'],
  ['web-contents',        'Web',                  'Web pages and on-site content blocks.',                      'Content & Blog',       'app/Filament/Resources/WebContentResource.php'],
  ['social-media-posts',  'Social Media',         'Social posts across channels.',                              'Content & Blog',       'app/Filament/Resources/SocialMediaPostResource.php'],
  ['blog-posts',          'Blog',                 'Blog post authoring and publishing.',                        'Content & Blog',       'app/Filament/Resources/BlogPostResource.php'],
  ['physical-assets',     'Physical',             'Physical marketing assets (signage, mailers, etc).',         'Content & Blog',       'app/Filament/Resources/PhysicalAssetResource.php'],

  // AI Tools
  ['ai-dashboard',        'AI Dashboard',         'Agent activity, queue depth, recent runs.',                  'AI Tools',             'app/Filament/Pages/AiDashboard.php'],
  ['agents',              'Agents',               'Agent registry and configuration.',                          'AI Tools',             'app/Filament/Resources/AgentResource.php'],
  ['workflows',           'Workflows',            'Multi-step agent workflows.',                                'AI Tools',             'app/Filament/Resources/WorkflowResource.php'],
  ['architectures',       'Architecture',         'Agent architectures (memory + tools).',                      'AI Tools',             'app/Filament/Resources/ArchitectureResource.php'],

  // Integrations
  ['integrations-dashboard',  'Integrations Dashboard', 'Status of every external integration.',                'Integrations',         'app/Filament/Pages/IntegrationsDashboard.php'],
  ['marketplace-workspace',   'Marketplace',            'Marketplace integrations workspace.',                  'Integrations',         'app/Filament/Resources/MarketplaceWorkspaceResource.php'],
  ['messages-workspace',      'Messages',               'Unified messaging inbox.',                             'Integrations',         'app/Filament/Resources/MessagesWorkspaceResource.php'],
  ['api-integrations',        'API',                    'API integrations and credentials.',                    'Integrations',         'app/Filament/Resources/ApiIntegrationResource.php'],
  ['external-leads',          'External Leads',         'Incoming leads from external sources.',                'Integrations',         'app/Filament/Resources/ExternalLeadResource.php'],
  ['credentials',             'Credentials',            'Website logins for dashboards and vendor portals.',    'Integrations',         'app/Filament/Resources/CredentialResource.php'],
  ['snippets',                'Snippets',               'Reusable code/text snippets.',                         'Integrations',         'app/Filament/Resources/SnippetResource.php'],
  ['google-workspace',        'Google Workspace',       'Google integration status and scopes.',                'Integrations',         'app/Filament/Resources/GoogleWorkspaceResource.php'],
  ['webhooks',                'Webhooks',               'Inbound and outbound webhook subscriptions.',          'Integrations',         'app/Filament/Resources/WebhookResource.php'],

  // Administration
  ['log',                 'Log',                  'System and audit log.',                                      'Administration',       'app/Filament/Resources/LogResource.php'],
  ['users',               'Users',                'Users, roles, and permissions.',                             'Administration',       'app/Filament/Resources/UserResource.php'],
];

const tpl = ({ title, description, group, source }) => `import React from 'react';
import { PagePlaceholder } from '../../${'/..'.repeat(routeDepth - 1)}/src/components/ui/PagePlaceholder';

export default function Page() {
  return (
    <PagePlaceholder
      title=${JSON.stringify(title)}
      description=${JSON.stringify(description)}
      group=${JSON.stringify(group)}
      source=${JSON.stringify(source)}
    />
  );
}
`;

let routeDepth = 0;
let created = 0;
let skipped = 0;

for (const [route, title, description, group, source] of PAGES) {
  const filePath = resolve(ROOT, 'app', 'admin', route, 'page.tsx');
  if (existsSync(filePath)) {
    skipped++;
    continue;
  }
  routeDepth = route.split('/').length; // for relative import depth
  const importPrefix = '../'.repeat(2 + routeDepth) + 'src/components/ui/PagePlaceholder';
  const content = `import React from 'react';
import { PagePlaceholder } from '${importPrefix}';

export default function Page() {
  return (
    <PagePlaceholder
      title=${JSON.stringify(title)}
      description=${JSON.stringify(description)}
      group=${JSON.stringify(group)}
      source=${JSON.stringify(source)}
    />
  );
}
`;
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, content, 'utf8');
  created++;
  console.log(`+ ${route}`);
}

console.log(`\nCreated ${created} placeholder pages, skipped ${skipped} existing.`);
