<?php

require_once __DIR__ . '/console-page.php';

function get_admin_feature_page_catalog(): array {
    return [
        'invoicing' => ['group_key' => 'operations', 'feature_key' => 'operations-invoicing', 'records_key' => 'invoicing', 'title' => 'Invoicing', 'intro' => 'Review, search, and update invoice records from a dedicated page.', 'page_type' => 'table', 'add_label' => 'Add Invoice'],
        'expenses' => ['group_key' => 'operations', 'feature_key' => 'operations-expenses', 'records_key' => 'expenses', 'title' => 'Expenses', 'intro' => 'Track operations expenses without sharing space with the rest of the console.', 'page_type' => 'table', 'add_label' => 'Add Expense'],
        'estimates' => ['group_key' => 'operations', 'feature_key' => 'operations-estimates', 'records_key' => 'estimates', 'title' => 'Estimates', 'intro' => 'Manage estimate rows in one focused view.', 'page_type' => 'table', 'add_label' => 'Add Estimate'],
        'products' => ['group_key' => 'operations', 'feature_key' => 'operations-products', 'records_key' => 'products', 'title' => 'Products', 'intro' => 'Maintain the product and service catalog from its own page.', 'page_type' => 'table', 'add_label' => 'Add Product'],
        'journal' => ['group_key' => 'accounting', 'feature_key' => 'journal', 'records_key' => 'journal', 'title' => 'Journal', 'intro' => 'Review and add journal entries without the broader accounting modal stack.', 'page_type' => 'table', 'add_label' => 'Add'],
        'banking' => ['group_key' => 'accounting', 'feature_key' => 'banking-modal', 'records_key' => 'banking', 'title' => 'Banking', 'intro' => 'Search banking rows and import new CSV files from a dedicated page.', 'page_type' => 'table-with-upload'],
        'inventory' => ['group_key' => 'accounting', 'feature_key' => 'accounting-inventory', 'records_key' => 'inventory', 'title' => 'Inventory', 'intro' => 'Keep inventory edits isolated to a single page.', 'page_type' => 'table', 'add_label' => 'Add Item'],
        'chart-of-accounts' => ['group_key' => 'accounting', 'feature_key' => 'chart-of-accounts', 'records_key' => 'chart-of-accounts', 'title' => 'Chart of Accounts', 'intro' => 'Open the account structure on its own page for editing.', 'page_type' => 'table', 'add_label' => 'Add Account'],
        'accounting-expenses' => ['group_key' => 'accounting', 'feature_key' => 'accounting-expenses', 'records_key' => 'accounting-expenses', 'title' => 'Accounting Expenses', 'intro' => 'Review and update accounting expenses from a dedicated page.', 'page_type' => 'table', 'add_label' => 'Add Expense'],
        'password-reset-requests' => ['group_key' => 'site-controls', 'feature_key' => 'password-reset-requests', 'records_key' => 'password-reset-requests', 'title' => 'Password Reset Requests', 'intro' => 'Audit reset code issuance from a dedicated page.', 'page_type' => 'table'],
        'create-user' => ['group_key' => 'site-controls', 'feature_key' => 'admin-users', 'records_key' => '', 'title' => 'Create User', 'intro' => 'Always-open add-user form with the current admin user list beneath it.', 'page_type' => 'create-user'],
        'pages' => ['group_key' => 'site-controls', 'feature_key' => 'site-pages', 'records_key' => 'pages', 'title' => 'Pages', 'intro' => 'Edit page control rows from their own management page.', 'page_type' => 'table'],
        'services' => ['group_key' => 'site-controls', 'feature_key' => 'site-services', 'records_key' => 'services', 'title' => 'Services', 'intro' => 'Edit service control rows from their own management page.', 'page_type' => 'table'],
        'image-library' => ['group_key' => 'images', 'feature_key' => 'images-gallery', 'records_key' => '', 'title' => 'Image Library', 'intro' => 'Upload, browse, process, and review shared images from a single image workspace page.', 'page_type' => 'image-library'],
        'image-submissions' => ['group_key' => 'images', 'feature_key' => 'images-submissions', 'records_key' => '', 'title' => 'Image Submissions', 'intro' => 'Review front-end image submissions from a dedicated queue page.', 'page_type' => 'image-submissions'],
        'integrations-manager' => ['group_key' => 'integrations', 'feature_key' => 'integrations-data-control', 'records_key' => '', 'title' => 'Integrations Manager', 'intro' => 'Manage services, types, keys, endpoints, and integration records from a dedicated page.', 'page_type' => 'integrations'],
    ];
}

function get_admin_feature_page_config(string $slug): array {
    $catalog = get_admin_feature_page_catalog();
    if (!isset($catalog[$slug])) {
        throw new InvalidArgumentException('Unknown admin feature page.');
    }

    return $catalog[$slug];
}

function build_admin_feature_page_href(string $slug): string {
    return admin_url('features/' . $slug . '.php');
}

function render_admin_console_hub_page(string $groupKey): void {
    $db = prepare_admin_page();
    [$noticeMessage, $errorMessage, $activeModal] = handle_admin_console_post_request($db, $groupKey);
    $header = build_admin_console_header_context($groupKey);
    $groupConfig = get_admin_console_group_config($groupKey);
    $profitCards = build_admin_console_profit_cards();
    $integrationSummary = build_admin_console_integration_summary();
    $features = [];
    foreach ($groupConfig['features'] as $feature) {
        $features[] = array_merge($feature, [
            'profit_card' => $profitCards[(string) ($feature['key'] ?? '')] ?? null,
            'integration_summary' => (string) ($feature['body_type'] ?? '') === 'integration-stats' ? $integrationSummary : null,
        ]);
    }

    $quickModals = [];
    if ($groupKey === 'operations') {
        $registry = build_admin_console_modal_registry($db);
        foreach (['operations-take-payment', 'operations-mark-paid'] as $modalId) {
            if (isset($registry[$modalId])) {
                $quickModals[$modalId] = $registry[$modalId];
            }
        }
    }

    render_admin_page('console-hub', array_merge($header, compact('db', 'features', 'noticeMessage', 'errorMessage', 'activeModal', 'quickModals')));
}

function render_admin_feature_page(string $slug): void {
    $config = get_admin_feature_page_config($slug);
    $db = prepare_admin_page();
    [$noticeMessage, $errorMessage, $activeModal] = handle_admin_console_post_request($db, (string) ($config['group_key'] ?? 'operations'));
    $groupHeader = build_admin_console_header_context((string) ($config['group_key'] ?? 'operations'));
    $pageType = (string) ($config['page_type'] ?? 'table');
    $featureKey = (string) ($config['feature_key'] ?? '');
    $recordsKey = (string) ($config['records_key'] ?? '');
    $rows = $recordsKey !== '' ? get_admin_console_feature_records($recordsKey) : [];
    $recordEditorState = build_posted_admin_console_record_editor_state($_POST ?? [], $errorMessage ?? null);
    if (($recordEditorState['feature_key'] ?? '') === '') {
        $recordEditorState = build_requested_admin_console_record_editor_state($_GET ?? []);
    }

    $viewData = array_merge($groupHeader, [
        'pageTitle' => (string) ($config['title'] ?? 'Feature') . ' - Console',
        'navigationCurrentPage' => (string) (($groupHeader['navigation'][(string) ($config['group_key'] ?? 'operations')]['href'] ?? 'operations.php')),
        'featureSlug' => $slug,
        'featurePageTitle' => (string) ($config['title'] ?? 'Feature'),
        'featurePageIntro' => (string) ($config['intro'] ?? ''),
        'featurePageType' => $pageType,
        'featurePageKey' => $featureKey,
        'featureRows' => $rows,
        'recordEditorState' => $recordEditorState,
        'noticeMessage' => $noticeMessage,
        'errorMessage' => $errorMessage,
        'activeModal' => $activeModal,
        'activeModalId' => trim((string) $activeModal),
        'addLabel' => (string) ($config['add_label'] ?? ''),
        'adminUsers' => get_admin_users($db),
        'imageLibraryImages' => get_image_library_images(),
        'imageLibraryTags' => get_image_library_tag_catalog(),
        'imageSubmissions' => get_image_submissions(),
        'imageEditRecord' => build_posted_image_edit_record($_POST ?? [], $errorMessage ?? null),
        'imageBatchState' => build_posted_image_batch_state($_POST ?? [], $errorMessage ?? null),
        'integrationRecords' => get_integration_records(),
        'integrationTableRows' => get_integration_table_rows(),
        'integrationServiceOptions' => get_integration_service_catalog(load_integrations_dataset()['custom_services'] ?? []),
        'integrationTypeOptions' => get_integration_type_catalog(),
        'integrationTypeTemplates' => get_integration_type_data_templates(),
        'integrationTypeHelpText' => get_integration_type_help_text(),
        'integrationFormRecord' => build_posted_integration_form_record($_POST ?? [], $errorMessage ?? null),
        'integrationStorageDirectories' => get_integration_storage_directories(),
    ]);

    render_admin_page('feature', $viewData);
}