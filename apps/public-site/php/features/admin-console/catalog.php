<?php

function get_admin_console_navigation_groups(): array {
    return [
        'operations' => ['title' => 'Operations', 'href' => 'operations.php'],
        'site-controls' => ['title' => 'Site Controls', 'href' => 'site-controls.php'],
        'accounting' => ['title' => 'Accounting', 'href' => 'accounting.php'],
        'marketing' => ['title' => 'Marketing', 'href' => 'marketing.php'],
        'integrations' => ['title' => 'Integrations', 'href' => 'integrations.php'],
        'images' => ['title' => 'Images', 'href' => 'images.php'],
    ];
}

function get_admin_console_group_catalog(): array {
    return [
        'operations' => [
            'title' => 'Operations',
            'intro' => 'Daily job flow, customer follow-up, payment actions, and field-facing records live here.',
            'features' => [
                ['key' => 'pay', 'title' => 'Pay', 'card_type' => 'multi-action', 'description' => 'Keep the payment action simple: either take payment now or mark an invoice paid.', 'actions' => [['label' => 'Take Payment', 'modal' => 'operations-take-payment', 'variant' => 'primary'], ['label' => 'Mark as Paid', 'modal' => 'operations-mark-paid', 'variant' => 'secondary']]],
                ['key' => 'crm', 'title' => 'CRM', 'card_type' => 'single-action', 'description' => 'Open the dedicated CRM workspace for lead, customer, and job management.', 'actions' => [['label' => 'Open', 'href' => 'crm.php', 'variant' => 'primary']]],
                ['key' => 'invoicing', 'title' => 'Invoicing', 'card_type' => 'table-view', 'description' => 'Open the full invoicing table and manage invoice records in one place.', 'actions' => [['label' => 'Open', 'href' => 'features/invoicing.php', 'variant' => 'primary']]],
                ['key' => 'expenses', 'title' => 'Expenses', 'card_type' => 'table-view', 'description' => 'Review operations expenses in the full table workspace.', 'actions' => [['label' => 'Open', 'href' => 'features/expenses.php', 'variant' => 'primary']]],
                ['key' => 'estimates', 'title' => 'Estimates', 'card_type' => 'table-view', 'description' => 'Open the estimates table and manage estimate records.', 'actions' => [['label' => 'Open', 'href' => 'features/estimates.php', 'variant' => 'primary']]],
                ['key' => 'products', 'title' => 'Products', 'card_type' => 'table-view', 'description' => 'Open the products table and manage catalog records.', 'actions' => [['label' => 'Open', 'href' => 'features/products.php', 'variant' => 'primary']]],
            ],
        ],
        'site-controls' => [
            'title' => 'Site Controls',
            'intro' => 'Manage the website surface itself: pages, services, images, ads, blog access, and user control utilities.',
            'features' => [
                ['key' => 'pages', 'title' => 'Pages', 'card_type' => 'table-view', 'description' => 'Open the full pages table for website content management.', 'actions' => [['label' => 'Open', 'href' => 'features/pages.php', 'variant' => 'primary']]],
                ['key' => 'services', 'title' => 'Services', 'card_type' => 'table-view', 'description' => 'Open the services table and manage service visibility and settings.', 'actions' => [['label' => 'Open', 'href' => 'features/services.php', 'variant' => 'primary']]],
                ['key' => 'site-images', 'title' => 'Images', 'card_type' => 'multi-action', 'description' => 'Open the shared image library page and review front-end submissions from one site-controls card.', 'actions' => [['label' => 'Open', 'href' => 'features/image-library.php', 'variant' => 'primary'], ['label' => 'Submissions', 'href' => 'features/image-submissions.php', 'variant' => 'secondary']]],
                ['key' => 'website-ads', 'title' => 'Website Ads', 'card_type' => 'table-view', 'description' => 'Open the website ads table and review active ad records.', 'actions' => [['label' => 'Open', 'href' => 'ads.php', 'variant' => 'primary']]],
                ['key' => 'site-blog', 'title' => 'Blog', 'card_type' => 'table-view', 'description' => 'Open the blog editor page without leaving the site-controls workspace.', 'actions' => [['label' => 'Open', 'href' => 'blog.php', 'variant' => 'primary']]],
                ['key' => 'create-user', 'title' => 'Create User', 'card_type' => 'single-action', 'description' => 'Add a login user directly to the login_user table through a dedicated page.', 'actions' => [['label' => 'Open', 'href' => 'features/create-user.php', 'variant' => 'primary']]],
            ],
        ],
        'accounting' => [
            'title' => 'Accounting',
            'intro' => 'High-level financial cards plus accounting tables and modal-led tools for banking and journal work.',
            'features' => [
                ['key' => 'cash-flow', 'title' => 'Cash Flow', 'card_type' => 'basic', 'body_type' => 'metric', 'description' => 'Track current cash position with a quick accounting snapshot.', 'actions' => [['label' => 'Open', 'href' => 'features/banking.php', 'variant' => 'primary']]],
                ['key' => 'profit-loss', 'title' => 'Profit Loss', 'card_type' => 'basic', 'body_type' => 'metric', 'description' => 'Review the current profit and loss position from the accounting summary.', 'actions' => [['label' => 'Open', 'href' => 'features/journal.php', 'variant' => 'primary']]],
                ['key' => 'income', 'title' => 'Income', 'card_type' => 'basic', 'body_type' => 'metric', 'description' => 'See the current income total and drill into accounting records.', 'actions' => [['label' => 'Open', 'href' => 'features/accounting-expenses.php', 'variant' => 'primary']]],
                ['key' => 'accounting-expenses', 'title' => 'Expenses', 'card_type' => 'table-view', 'description' => 'Open the accounting expenses table and review all expense records.', 'actions' => [['label' => 'Open', 'href' => 'features/accounting-expenses.php', 'variant' => 'primary']]],
                ['key' => 'inventory', 'title' => 'Inventory', 'card_type' => 'table-view', 'description' => 'Open the inventory table and manage inventory records.', 'actions' => [['label' => 'Open', 'href' => 'features/inventory.php', 'variant' => 'primary']]],
                ['key' => 'banking', 'title' => 'Banking', 'card_type' => 'table-view', 'description' => 'Browse bank transactions from CSV, search them, and upload a new CSV from a dedicated page.', 'actions' => [['label' => 'Open', 'href' => 'features/banking.php', 'variant' => 'primary']]],
                ['key' => 'chart-of-accounts', 'title' => 'Chart of Accounts', 'card_type' => 'table-view', 'description' => 'Open the account structure and its connection to journal entries.', 'actions' => [['label' => 'Open', 'href' => 'features/chart-of-accounts.php', 'variant' => 'primary']]],
                ['key' => 'journal', 'title' => 'Journal', 'card_type' => 'table-view', 'description' => 'Open the searchable journal table for double-entry review.', 'actions' => [['label' => 'Open', 'href' => 'features/journal.php', 'variant' => 'primary']]],
            ],
        ],
        'marketing' => [
            'title' => 'Marketing',
            'intro' => 'Active marketing systems stay live while the rest remain visible as intentionally staged placeholders.',
            'features' => [
                ['key' => 'marketing-ads', 'title' => 'Ads', 'card_type' => 'table-view', 'description' => 'Open the ads page and review live ad records.', 'actions' => [['label' => 'Open', 'href' => 'ads.php', 'variant' => 'primary']]],
                ['key' => 'marketing-blog', 'title' => 'Blog', 'card_type' => 'table-view', 'description' => 'Open the blog editor page without leaving the marketing group.', 'actions' => [['label' => 'Open', 'href' => 'blog.php', 'variant' => 'primary']]],
                ['key' => 'reviews', 'title' => 'Reviews', 'card_type' => 'single-action', 'description' => 'Under Construction', 'actions' => [['label' => 'Open', 'modal' => 'placeholder-reviews', 'variant' => 'primary']]],
                ['key' => 'assets', 'title' => 'Assets', 'card_type' => 'single-action', 'description' => 'Under Construction', 'actions' => [['label' => 'Open', 'modal' => 'placeholder-assets', 'variant' => 'primary']]],
                ['key' => 'qr-codes', 'title' => 'QR Codes', 'card_type' => 'single-action', 'description' => 'Under Construction', 'actions' => [['label' => 'Open', 'modal' => 'placeholder-qr-codes', 'variant' => 'primary']]],
                ['key' => 'team-wear', 'title' => 'Team Wear', 'card_type' => 'single-action', 'description' => 'Under Construction', 'actions' => [['label' => 'Open', 'modal' => 'placeholder-team-wear', 'variant' => 'primary']]],
            ],
        ],
        'integrations' => [
            'title' => 'Integrations',
            'intro' => 'Integration services, webhook endpoints, API keys, credentials, passkeys, and wireframe notes live here first before expanding into other sections.',
            'features' => [
                ['key' => 'integrations-data-control', 'title' => 'Data Control', 'card_type' => 'table-view', 'body_type' => 'integration-stats', 'description' => 'Open the integrations manager and review service, type, and record totals.', 'actions' => [['label' => 'Open', 'href' => 'features/integrations-manager.php', 'variant' => 'primary']]],
                ['key' => 'integrations-view-control', 'title' => 'View Control', 'card_type' => 'basic', 'body_type' => 'integration-stats', 'description' => 'Display service counts, type counts, and total integrations in one clean summary.', 'actions' => [['label' => 'Open', 'href' => 'features/integrations-manager.php', 'variant' => 'primary']]],
                ['key' => 'integrations-form-control', 'title' => 'Form Control', 'card_type' => 'single-action', 'description' => 'Open the integrations page and manage services, types, and data records.', 'actions' => [['label' => 'Open', 'href' => 'features/integrations-manager.php', 'variant' => 'primary']]],
            ],
        ],
        'images' => [
            'title' => 'Images',
            'intro' => 'The shared image workspace keeps upload, gallery browsing, and selected-asset editing grouped together.',
            'features' => [
                ['key' => 'images-manager', 'title' => 'Library Tools', 'card_type' => 'multi-action', 'description' => 'Upload assets, process library images, review submissions, and open the gallery from one image workspace.', 'actions' => [['label' => 'Open', 'href' => 'features/image-library.php', 'variant' => 'primary'], ['label' => 'Submissions', 'href' => 'features/image-submissions.php', 'variant' => 'secondary']]],
            ],
        ],
    ];
}

function get_admin_console_group_config(string $groupKey): ?array {
    $catalog = get_admin_console_group_catalog();
    return $catalog[$groupKey] ?? null;
}