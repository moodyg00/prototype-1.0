<?php

require_once __DIR__ . '/../../../php/features/admin-console/catalog.php';
require_once __DIR__ . '/../../../php/repositories/admin-console.php';
require_once __DIR__ . '/../../../php/repositories/ads.php';
require_once __DIR__ . '/../../../php/repositories/image-library.php';
require_once __DIR__ . '/../../../php/repositories/image-submissions.php';
require_once __DIR__ . '/../../../php/repositories/integrations.php';
require_once __DIR__ . '/../../../php/services/image-processing.php';
require_once __DIR__ . '/image-library-upload.php';
require_once __DIR__ . '/../repositories/admin-users.php';

function render_admin_console_group_page(string $groupKey): void {
    $db = prepare_admin_page();
    [$noticeMessage, $errorMessage, $activeModal] = handle_admin_console_post_request($db, $groupKey);

    render_admin_page('console', array_merge(
        build_admin_console_group_view_model($db, $groupKey),
        compact('db', 'noticeMessage', 'errorMessage', 'activeModal')
    ));
}

function build_admin_console_header_context(string $groupKey): array {
    $config = get_admin_console_group_config($groupKey);
    if ($config === null) {
        throw new InvalidArgumentException('Unknown console group.');
    }

    $groupTitle = (string) ($config['title'] ?? 'Console');

    return [
        'groupKey' => $groupKey,
        'groupTitle' => $groupTitle,
        'pageTitle' => $groupTitle . ' - Console',
        'groupIntro' => (string) ($config['intro'] ?? ''),
        'navigation' => get_admin_console_navigation_groups(),
    ];
}

function get_admin_console_feature_records(string $featureKey): array {
    switch ($featureKey) {
        case 'invoicing':
            return get_admin_console_records('invoicing');
        case 'expenses':
            return get_admin_console_records('operations-expenses');
        case 'estimates':
            return get_admin_console_records('estimates');
        case 'products':
            return get_admin_console_records('products');
        case 'pages':
            return get_admin_console_page_control_rows();
        case 'services':
            return get_admin_console_service_control_rows();
        case 'website-ads':
            return get_ads_records();
        case 'accounting-expenses':
            return get_admin_console_records('accounting-expenses');
        case 'inventory':
            return get_admin_console_records('inventory');
        case 'banking':
            return get_admin_console_records('banking');
        case 'chart-of-accounts':
            return get_admin_console_records('chart-of-accounts');
        case 'journal':
            return get_admin_console_records('journal');
        case 'blog-editor':
        case 'site-blog':
        case 'marketing-blog':
            return get_admin_console_records('blog-posts');
        case 'integrations-data-control':
            return get_integration_table_rows();
        default:
            return [];
    }
}

function get_admin_console_feature_table_rows(string $featureKey, $limit = 'all'): array {
    $records = get_admin_console_feature_records($featureKey);
    if ($limit === 'all') {
        return $records;
    }

    return array_slice($records, 0, (int) $limit);
}

function get_admin_console_record_editor_config(string $featureKey): array {
    $configs = [
        'pay-invoices' => ['feature_key' => $featureKey, 'dataset_key' => 'invoicing', 'editable' => true, 'title' => 'Edit Invoice'],
        'operations-invoicing' => ['feature_key' => $featureKey, 'dataset_key' => 'invoicing', 'editable' => true, 'title' => 'Edit Invoice'],
        'operations-expenses' => ['feature_key' => $featureKey, 'dataset_key' => 'operations-expenses', 'editable' => true, 'title' => 'Edit Expense'],
        'operations-estimates' => ['feature_key' => $featureKey, 'dataset_key' => 'estimates', 'editable' => true, 'title' => 'Edit Estimate'],
        'operations-products' => ['feature_key' => $featureKey, 'dataset_key' => 'products', 'editable' => true, 'title' => 'Edit Product'],
        'blog-editor' => ['feature_key' => $featureKey, 'dataset_key' => 'blog-posts', 'editable' => true, 'title' => 'Edit Blog Post'],
        'password-reset-requests' => ['feature_key' => $featureKey, 'dataset_key' => 'password-reset-requests', 'editable' => true, 'title' => 'Edit Reset Request'],
        'accounting-expenses' => ['feature_key' => $featureKey, 'dataset_key' => 'accounting-expenses', 'editable' => true, 'title' => 'Edit Expense'],
        'accounting-inventory' => ['feature_key' => $featureKey, 'dataset_key' => 'inventory', 'editable' => true, 'title' => 'Edit Inventory Item'],
        'banking-modal' => ['feature_key' => $featureKey, 'dataset_key' => 'banking', 'editable' => true, 'title' => 'Edit Banking Row'],
        'chart-of-accounts' => ['feature_key' => $featureKey, 'dataset_key' => 'chart-of-accounts', 'editable' => true, 'title' => 'Edit Account'],
        'journal' => ['feature_key' => $featureKey, 'dataset_key' => 'journal', 'editable' => true, 'title' => 'Edit Journal Entry'],
        'site-pages' => ['feature_key' => $featureKey, 'dataset_key' => 'page-controls', 'editable' => true, 'title' => 'Edit Page'],
        'site-services' => ['feature_key' => $featureKey, 'dataset_key' => 'service-controls', 'editable' => true, 'title' => 'Edit Service'],
        'site-website-ads' => ['feature_key' => $featureKey, 'dataset_key' => null, 'editable' => false, 'title' => 'Inspect Ad'],
        'ads-table' => ['feature_key' => $featureKey, 'dataset_key' => null, 'editable' => false, 'title' => 'Inspect Ad'],
        'admin-users' => ['feature_key' => $featureKey, 'dataset_key' => null, 'editable' => false, 'title' => 'Inspect User'],
    ];

    $defaultTitle = 'Edit Record';

    return $configs[$featureKey] ?? ['feature_key' => $featureKey, 'dataset_key' => null, 'editable' => false, 'title' => $defaultTitle];
}

function build_blank_admin_console_record_editor_state(): array {
    return [
        'feature_key' => '',
        'dataset_key' => null,
        'record_id' => '',
        'title' => 'Edit Record',
        'editable' => false,
        'fields' => [],
        'row' => [],
        'read_only_message' => 'This row can be viewed here, but it is not managed through the shared console editor.',
    ];
}

function cast_admin_console_record_value($submittedValue, $existingValue) {
    if (is_array($existingValue)) {
        $parts = array_filter(array_map('trim', explode(',', (string) $submittedValue)), static function (string $value): bool {
            return $value !== '';
        });
        return array_values($parts);
    }

    if (is_int($existingValue)) {
        return (int) $submittedValue;
    }

    if (is_float($existingValue)) {
        return (float) $submittedValue;
    }

    if (is_bool($existingValue)) {
        return in_array(strtolower(trim((string) $submittedValue)), ['1', 'true', 'yes', 'on'], true);
    }

    return trim((string) $submittedValue);
}

function normalize_admin_console_record_submission(array $submittedRecord, array $existingRecord): array {
    $normalized = [];

    foreach ($existingRecord as $column => $existingValue) {
        if (in_array($column, ['updated_at'], true)) {
            continue;
        }

        if ($column === 'id') {
            $normalized['id'] = trim((string) ($submittedRecord['id'] ?? $existingValue));
            continue;
        }

        if (!array_key_exists($column, $submittedRecord)) {
            $normalized[$column] = $existingValue;
            continue;
        }

        $normalized[$column] = cast_admin_console_record_value($submittedRecord[$column], $existingValue);
    }

    foreach ($submittedRecord as $column => $value) {
        if (isset($normalized[$column]) || $column === 'updated_at') {
            continue;
        }

        $normalized[$column] = trim((string) $value);
    }

    return $normalized;
}

function build_admin_console_record_editor_state_from_row(string $featureKey, array $row): array {
    $config = get_admin_console_record_editor_config($featureKey);
    $fields = [];

    foreach ($row as $column => $value) {
        if (in_array($column, ['id', 'updated_at'], true)) {
            continue;
        }

        $fields[] = [
            'name' => (string) $column,
            'label' => format_admin_console_column_label((string) $column),
            'value' => is_array($value) ? implode(', ', array_map('strval', $value)) : (string) $value,
            'type' => in_array($column, ['amount', 'price'], true) ? 'number' : (in_array($column, ['quantity'], true) ? 'number' : 'text'),
            'step' => in_array($column, ['amount', 'price'], true) ? '0.01' : '1',
        ];
    }

    return [
        'feature_key' => $featureKey,
        'dataset_key' => $config['dataset_key'],
        'record_id' => (string) ($row['id'] ?? ''),
        'title' => (string) ($config['title'] ?? 'Edit Record'),
        'editable' => (bool) ($config['editable'] ?? false),
        'fields' => $fields,
        'row' => $row,
        'read_only_message' => 'This row can be viewed here, but it is not managed through the shared console editor.',
    ];
}

function build_posted_admin_console_record_editor_state(array $post, ?string $errorMessage): array {
    $action = trim((string) ($post['action'] ?? ''));
    if ($errorMessage === null || !in_array($action, ['save_console_record', 'delete_console_record'], true)) {
        return build_blank_admin_console_record_editor_state();
    }

    $featureKey = trim((string) ($post['feature_key'] ?? ''));
    $row = isset($post['record']) && is_array($post['record']) ? $post['record'] : [];
    $row['id'] = trim((string) ($post['record_id'] ?? ($row['id'] ?? '')));

    return build_admin_console_record_editor_state_from_row($featureKey, $row);
}

function build_admin_console_profit_cards(): array {
    $invoices = get_admin_console_records('invoicing');
    $accountingExpenses = get_admin_console_records('accounting-expenses');
    $income = 0.0;
    $expenses = 0.0;

    foreach ($invoices as $invoice) {
        if ((string) ($invoice['status'] ?? '') === 'paid') {
            $income += (float) ($invoice['amount'] ?? 0);
        }
    }

    $income += 2500.0;

    foreach ($accountingExpenses as $expense) {
        $expenses += abs((float) ($expense['amount'] ?? 0));
    }

    return [
        'cash-flow' => ['value' => $income - $expenses, 'tone' => ($income - $expenses) >= 0 ? 'positive' : 'negative', 'filters' => []],
        'profit-loss' => ['value' => $income - $expenses, 'tone' => ($income - $expenses) >= 0 ? 'positive' : 'negative', 'filters' => ['month', 'quarter', 'ytd', 'last year']],
        'income' => ['value' => $income, 'tone' => $income >= 0 ? 'positive' : 'negative', 'filters' => ['month', 'quarter', 'ytd', 'last year']],
    ];
}

function build_blank_image_edit_record(): array {
    return [
        'id' => '',
        'alt' => '',
        'visible_on_page' => '',
        'tags' => [],
    ];
}

function build_posted_image_edit_record(array $post, ?string $errorMessage): array {
    if (!in_array(trim((string) ($post['action'] ?? '')), ['save_image_record', 'process_image_asset'], true)) {
        return build_blank_image_edit_record();
    }

    return [
        'id' => trim((string) ($post['id'] ?? '')),
        'alt' => trim((string) ($post['alt'] ?? '')),
        'visible_on_page' => trim((string) ($post['visible_on_page'] ?? '')),
        'tags' => parse_image_library_tags($post['selected_tags'] ?? [], (string) ($post['custom_tags'] ?? '')),
    ];
}

function get_unpaid_invoice_rows(): array {
    return array_values(array_filter(get_admin_console_records('invoicing'), static function (array $invoice): bool {
        return strtolower(trim((string) ($invoice['status'] ?? ''))) !== 'paid';
    }));
}

function build_blank_image_batch_state(): array {
    return [
        'selected_tags' => [],
        'custom_tags' => '',
        'format' => 'webp',
        'max_width' => '1600',
        'max_height' => '0',
    ];
}

function build_posted_image_batch_state(array $post, ?string $errorMessage): array {
    if ($errorMessage === null || trim((string) ($post['action'] ?? '')) !== 'batch_process_image_assets') {
        return build_blank_image_batch_state();
    }

    return [
        'selected_tags' => parse_image_library_tags($post['selected_tags'] ?? [], ''),
        'custom_tags' => trim((string) ($post['custom_tags'] ?? '')),
        'format' => trim((string) ($post['batch_format'] ?? 'webp')),
        'max_width' => trim((string) ($post['batch_max_width'] ?? '1600')),
        'max_height' => trim((string) ($post['batch_max_height'] ?? '0')),
    ];
}

function build_admin_console_create_record_row(string $featureKey, array $query = []): array {
    $config = get_admin_console_record_editor_config($featureKey);
    $datasetKey = trim((string) ($config['dataset_key'] ?? ''));
    $seed = $datasetKey !== '' ? (get_admin_console_records($datasetKey)[0] ?? []) : [];
    $row = ['id' => ''];

    foreach ($seed as $column => $value) {
        if (in_array($column, ['id', 'updated_at'], true)) {
            continue;
        }

        $row[$column] = is_array($value) ? [] : '';
    }

    if ($featureKey === 'journal') {
        $invoiceId = trim((string) ($query['invoice'] ?? ''));
        $row = array_merge([
            'title' => '',
            'status' => 'draft',
            'account' => '',
            'invoice_id' => '',
        ], $row);
        if ($invoiceId !== '') {
            $row['title'] = 'Payment recorded for ' . $invoiceId;
            $row['account'] = 'Cash / Service Revenue';
            $row['invoice_id'] = $invoiceId;
        }
    }

    return $row;
}

function build_requested_admin_console_record_editor_state(array $query): array {
    if (trim((string) ($query['modal'] ?? '')) !== 'record-editor' || empty($query['create'])) {
        return build_blank_admin_console_record_editor_state();
    }

    $featureKey = trim((string) ($query['feature_key'] ?? ''));
    if ($featureKey === '') {
        return build_blank_admin_console_record_editor_state();
    }

    $state = build_admin_console_record_editor_state_from_row($featureKey, build_admin_console_create_record_row($featureKey, $query));
    $state['record_id'] = '';
    $state['title'] = $featureKey === 'journal' ? 'Add Journal Entry' : ('Add ' . preg_replace('/^Edit\s+/', '', (string) ($state['title'] ?? 'Record')));
    $state['source_modal_id'] = trim((string) ($query['source_modal_id'] ?? ''));
    $state['source_invoice_id'] = trim((string) ($query['invoice'] ?? ''));
    $state['mark_invoice_paid'] = !empty($query['mark_invoice_paid']);

    return $state;
}

function build_admin_console_integration_summary(): array {
    return get_integration_dashboard_summary();
}

function build_blank_integration_form_record(): array {
    $templates = get_integration_type_data_templates();

    return [
        'id' => '',
        'name' => '',
        'service_key' => 'gmail',
        'custom_service_label' => '',
        'type_key' => 'snippet',
        'data_json' => json_encode($templates['snippet'], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES),
    ];
}

function build_posted_integration_form_record(array $post, ?string $errorMessage): array {
    if ($errorMessage === null || trim((string) ($post['action'] ?? '')) !== 'save_integration') {
        return build_blank_integration_form_record();
    }

    return [
        'id' => trim((string) ($post['id'] ?? '')),
        'name' => trim((string) ($post['name'] ?? '')),
        'service_key' => trim((string) ($post['service_key'] ?? 'gmail')),
        'custom_service_label' => trim((string) ($post['custom_service_label'] ?? '')),
        'type_key' => trim((string) ($post['type_key'] ?? 'snippet')),
        'data_json' => trim((string) ($post['data_json'] ?? '')),
    ];
}

function build_admin_console_group_view_model(PDO $db, string $groupKey): array {
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

    return array_merge($header, [
        'features' => $features,
        'pageClassName' => 'console ' . $groupKey,
        'adminUsers' => get_admin_users($db),
        'imageLibraryImages' => get_image_library_images(),
        'imageLibraryTags' => get_image_library_tag_catalog(),
        'modals' => build_admin_console_modal_registry($db),
        'imageSubmissions' => get_image_submissions(),
        'imageBatchState' => build_posted_image_batch_state($_POST ?? [], $errorMessage ?? null),
        'pendingResetRequests' => get_admin_console_records('password-reset-requests'),
        'integrationRecords' => get_integration_records(),
        'integrationTableRows' => get_integration_table_rows(),
        'integrationServiceOptions' => get_integration_service_catalog(load_integrations_dataset()['custom_services'] ?? []),
        'integrationTypeOptions' => get_integration_type_catalog(),
        'integrationTypeTemplates' => get_integration_type_data_templates(),
        'integrationTypeHelpText' => get_integration_type_help_text(),
        'integrationFormRecord' => build_blank_integration_form_record(),
        'integrationStorageDirectories' => get_integration_storage_directories(),
    ]);
}

function handle_admin_console_post_request(PDO $db, string $groupKey): array {
    $activeModal = trim((string) ($_GET['modal'] ?? ''));
    $noticeMessage = null;
    $errorMessage = null;

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        return [$noticeMessage, $errorMessage, $activeModal];
    }

    assert_valid_csrf_token($_POST['csrf_token'] ?? null);
    $action = trim((string) ($_POST['action'] ?? ''));

    try {
        switch ($action) {
            case 'create_user':
                create_admin_user(
                    $db,
                    trim((string) ($_POST['username'] ?? '')),
                    (string) ($_POST['password'] ?? ''),
                    trim((string) ($_POST['email'] ?? ''))
                );
                $noticeMessage = 'User created.';
                $activeModal = 'create-user';
                break;

            case 'upload_image':
                $uploadedRecords = store_uploaded_image_library_images($_FILES['image_file'] ?? [], [
                    'image_alt' => trim((string) ($_POST['image_alt'] ?? '')),
                    'selected_tags' => $_POST['selected_tags'] ?? [],
                    'custom_tags' => trim((string) ($_POST['custom_tags'] ?? '')),
                    'file_name_override' => trim((string) ($_POST['file_name_override'] ?? '')),
                ]);
                $noticeMessage = count($uploadedRecords) === 1 ? 'Image uploaded.' : count($uploadedRecords) . ' images uploaded.';
                $activeModal = 'images-gallery';
                break;

            case 'save_image_record':
                update_image_library_record($_POST);
                $noticeMessage = 'Image updated.';
                $activeModal = 'image-edit';
                break;

            case 'process_image_asset':
                $imageId = trim((string) ($_POST['id'] ?? ''));
                $record = get_image_library_image_by_id($imageId);
                if ($record === null) {
                    throw new InvalidArgumentException('Image record not found.');
                }

                $processedRecord = process_image_library_asset($record, [
                    'format' => trim((string) ($_POST['variant_format'] ?? '')),
                    'max_width' => (int) ($_POST['variant_max_width'] ?? 0),
                    'max_height' => (int) ($_POST['variant_max_height'] ?? 0),
                ]);
                update_image_library_record(array_merge(['id' => $imageId], $processedRecord));
                $noticeMessage = 'Image processed.';
                $activeModal = 'image-edit';
                break;

            case 'batch_process_image_assets':
                $selectedTags = parse_image_library_tags($_POST['selected_tags'] ?? [], (string) ($_POST['custom_tags'] ?? ''));
                $matchingImages = array_values(array_filter(get_image_library_images(), static function (array $image) use ($selectedTags): bool {
                    if ($selectedTags === []) {
                        return true;
                    }

                    $imageTags = is_array($image['tags'] ?? null) ? $image['tags'] : [];
                    foreach ($selectedTags as $tag) {
                        if (!in_array($tag, $imageTags, true)) {
                            return false;
                        }
                    }

                    return true;
                }));

                if ($matchingImages === []) {
                    throw new InvalidArgumentException('No images matched the selected batch filters.');
                }

                $processedCount = 0;
                foreach ($matchingImages as $image) {
                    $processedRecord = process_image_library_asset($image, [
                        'format' => trim((string) ($_POST['batch_format'] ?? '')),
                        'max_width' => (int) ($_POST['batch_max_width'] ?? 0),
                        'max_height' => (int) ($_POST['batch_max_height'] ?? 0),
                    ]);
                    update_image_library_record(array_merge(['id' => (string) ($image['id'] ?? '')], $processedRecord));
                    $processedCount += 1;
                }

                $noticeMessage = 'Processed ' . $processedCount . ' images.';
                $activeModal = 'images-batch';
                break;

            case 'take_invoice_payment':
                $invoiceId = trim((string) ($_POST['invoice_id'] ?? ''));
                $invoice = get_admin_console_record_by_id('invoicing', $invoiceId);
                if ($invoice === null) {
                    throw new InvalidArgumentException('Select an unpaid invoice first.');
                }

                save_admin_console_record('invoicing', array_merge($invoice, ['status' => 'paid']));
                $amount = trim((string) ($_POST['payment_amount'] ?? '')) !== '' ? (float) ($_POST['payment_amount'] ?? 0) : (float) ($invoice['amount'] ?? 0);
                save_admin_console_record('banking', [
                    'title' => 'Payment received for ' . $invoiceId,
                    'status' => 'cleared',
                    'amount' => $amount,
                ]);
                save_admin_console_record('journal', [
                    'title' => 'Payment received for ' . $invoiceId,
                    'status' => 'posted',
                    'account' => 'Cash / Service Revenue',
                    'invoice_id' => $invoiceId,
                ]);
                $noticeMessage = 'Payment recorded for ' . $invoiceId . '.';
                $activeModal = 'operations-take-payment';
                break;

            case 'approve_image_submission':
                approve_image_submission_to_library(trim((string) ($_POST['submission_id'] ?? '')), [
                    'alt' => trim((string) ($_POST['submission_alt'] ?? '')),
                    'selected_tags' => $_POST['selected_tags'] ?? [],
                    'custom_tags' => trim((string) ($_POST['custom_tags'] ?? '')),
                    'visible_on_page' => trim((string) ($_POST['visible_on_page'] ?? '')),
                ]);
                $noticeMessage = 'Submission approved and added to the library.';
                $activeModal = 'images-submissions';
                break;

            case 'reject_image_submission':
                update_image_submission_status(trim((string) ($_POST['submission_id'] ?? '')), 'rejected');
                $noticeMessage = 'Submission rejected.';
                $activeModal = 'images-submissions';
                break;

            case 'upload_banking_csv':
                $importedCount = import_admin_console_banking_csv($_FILES['csv_file'] ?? []);
                $noticeMessage = 'Imported ' . $importedCount . ' banking rows.';
                $activeModal = 'banking';
                break;

            case 'save_integration':
                $savedRecord = save_integration_record($_POST);
                $noticeMessage = 'Integration saved: ' . (string) ($savedRecord['name'] ?? 'record') . '.';
                $activeModal = 'integrations-manager';
                break;

            case 'delete_integration':
                delete_integration_record(trim((string) ($_POST['id'] ?? '')));
                $noticeMessage = 'Integration deleted.';
                $activeModal = 'integrations-manager';
                break;

            case 'save_console_record':
                $featureKey = trim((string) ($_POST['feature_key'] ?? ''));
                $sourceModalId = trim((string) ($_POST['source_modal_id'] ?? ''));
                $config = get_admin_console_record_editor_config($featureKey);
                if (!($config['editable'] ?? false) || trim((string) ($config['dataset_key'] ?? '')) === '') {
                    throw new InvalidArgumentException('This record cannot be edited from the shared console modal.');
                }

                $recordId = trim((string) ($_POST['record_id'] ?? ''));
                $existingRecord = get_admin_console_record_by_id((string) $config['dataset_key'], $recordId);
                if ($existingRecord === null) {
                    $existingRecord = build_admin_console_create_record_row($featureKey, ['invoice' => trim((string) ($_POST['source_invoice_id'] ?? ''))]);
                }

                $submittedRecord = isset($_POST['record']) && is_array($_POST['record']) ? $_POST['record'] : [];
                $submittedRecord['id'] = $recordId;
                $savedRecord = save_admin_console_record((string) $config['dataset_key'], normalize_admin_console_record_submission($submittedRecord, $existingRecord));
                if ($featureKey === 'journal' && !empty($_POST['mark_invoice_paid']) && trim((string) ($_POST['source_invoice_id'] ?? '')) !== '') {
                    $invoice = get_admin_console_record_by_id('invoicing', trim((string) ($_POST['source_invoice_id'] ?? '')));
                    if ($invoice !== null) {
                        save_admin_console_record('invoicing', array_merge($invoice, ['status' => 'paid']));
                    }
                }
                $noticeMessage = 'Record saved: ' . (string) ($savedRecord['title'] ?? $savedRecord['id'] ?? 'record') . '.';
                $activeModal = $sourceModalId !== '' ? $sourceModalId : 'record-editor';
                break;

            case 'delete_console_record':
                $featureKey = trim((string) ($_POST['feature_key'] ?? ''));
                $sourceModalId = trim((string) ($_POST['source_modal_id'] ?? ''));
                $config = get_admin_console_record_editor_config($featureKey);
                if (!($config['editable'] ?? false) || trim((string) ($config['dataset_key'] ?? '')) === '') {
                    throw new InvalidArgumentException('This record cannot be deleted from the shared console modal.');
                }

                delete_admin_console_record((string) $config['dataset_key'], trim((string) ($_POST['record_id'] ?? '')));
                $noticeMessage = 'Record deleted.';
                $activeModal = $sourceModalId !== '' ? $sourceModalId : 'record-editor';
                break;
        }
    } catch (Throwable $throwable) {
        $errorMessage = $throwable->getMessage();
        if (in_array($action, ['save_console_record', 'delete_console_record'], true)) {
            $activeModal = 'record-editor';
        } elseif (in_array($action, ['save_image_record', 'process_image_asset'], true)) {
            $activeModal = 'image-edit';
        } elseif ($action === 'batch_process_image_assets') {
            $activeModal = 'images-batch';
        } elseif (in_array($action, ['approve_image_submission', 'reject_image_submission'], true)) {
            $activeModal = 'images-submissions';
        }
    }

    return [$noticeMessage, $errorMessage, $activeModal];
}

function format_admin_console_column_label(string $column): string {
    $label = str_replace(['_', '-'], ' ', $column);
    return ucwords(trim($label));
}

function get_admin_console_table_columns(array $rows): array {
    if ($rows === []) {
        return [];
    }

    $columns = array_keys($rows[0]);
    return array_values(array_filter($columns, static function ($column): bool {
        return !in_array($column, ['id'], true);
    }));
}

function format_admin_console_cell_value(string $column, $value): string {
    if ($column === 'amount' || $column === 'price') {
        return '$' . number_format((float) $value, 2);
    }

    if ($column === 'quantity') {
        return (string) ((int) $value);
    }

    if ($column === 'updated_at' && trim((string) $value) !== '') {
        return date('M j, Y g:i a', strtotime((string) $value) ?: time());
    }

    if (is_bool($value)) {
        return $value ? 'Yes' : 'No';
    }

    return trim((string) $value);
}

function build_admin_console_modal_registry(PDO $db): array {
    return [
        'operations-take-payment' => ['title' => 'Take Payment', 'type' => 'take-payment'],
        'operations-mark-paid' => ['title' => 'Mark as Paid', 'type' => 'mark-paid'],
        'operations-invoicing' => ['title' => 'Invoicing', 'type' => 'table', 'rows' => get_admin_console_feature_records('invoicing')],
        'operations-expenses' => ['title' => 'Expenses', 'type' => 'table', 'rows' => get_admin_console_feature_records('expenses')],
        'operations-estimates' => ['title' => 'Estimates', 'type' => 'table', 'rows' => get_admin_console_feature_records('estimates')],
        'operations-products' => ['title' => 'Products', 'type' => 'table', 'rows' => get_admin_console_feature_records('products')],
        'site-pages' => ['title' => 'Pages', 'type' => 'table', 'rows' => get_admin_console_feature_records('pages')],
        'site-services' => ['title' => 'Services', 'type' => 'table', 'rows' => get_admin_console_feature_records('services')],
        'site-website-ads' => ['title' => 'Website Ads', 'type' => 'table', 'rows' => get_admin_console_feature_records('website-ads')],
        'site-controls-gallery' => ['title' => 'Image Gallery', 'type' => 'gallery'],
        'images-gallery' => ['title' => 'Image Gallery', 'type' => 'gallery'],
        'images-upload' => ['title' => 'Upload Image', 'type' => 'image-upload'],
        'images-batch' => ['title' => 'Batch Tools', 'type' => 'image-batch'],
        'images-submissions' => ['title' => 'Submission Queue', 'type' => 'submission-queue'],
        'image-carousel' => ['title' => 'Gallery', 'type' => 'image-carousel'],
        'image-edit' => ['title' => 'Edit Image', 'type' => 'image-edit'],
        'blog-editor' => ['title' => 'Blog', 'type' => 'table', 'rows' => get_admin_console_feature_table_rows('blog-editor', 10)],
        'create-user' => ['title' => 'Create User', 'type' => 'create-user', 'users' => get_admin_users($db)],
        'accounting-expenses' => ['title' => 'Expenses', 'type' => 'table', 'rows' => get_admin_console_feature_records('accounting-expenses')],
        'accounting-inventory' => ['title' => 'Inventory', 'type' => 'table', 'rows' => get_admin_console_feature_records('inventory')],
        'banking' => ['title' => 'Banking', 'type' => 'table-with-upload', 'rows' => get_admin_console_feature_records('banking')],
        'chart-of-accounts' => ['title' => 'Chart of Accounts', 'type' => 'table', 'rows' => get_admin_console_feature_records('chart-of-accounts')],
        'journal' => ['title' => 'Journal', 'type' => 'table', 'rows' => get_admin_console_feature_records('journal')],
        'ads-table' => ['title' => 'Ads', 'type' => 'table', 'rows' => array_slice(get_ads_records(), 0, 10)],
        'integrations-manager' => ['title' => 'Integrations', 'type' => 'integrations-manager'],
        'record-editor' => ['title' => 'Edit Record', 'type' => 'record-editor'],
        'selected-images' => ['title' => 'Selected Images', 'type' => 'selected-images'],
        'placeholder-reviews' => ['title' => 'Reviews', 'type' => 'placeholder'],
        'placeholder-assets' => ['title' => 'Assets', 'type' => 'placeholder'],
        'placeholder-qr-codes' => ['title' => 'QR Codes', 'type' => 'placeholder'],
        'placeholder-team-wear' => ['title' => 'Team Wear', 'type' => 'placeholder'],
        'placeholder-grok' => ['title' => 'Grok', 'type' => 'placeholder'],
        'placeholder-chatbot' => ['title' => 'ChatBot', 'type' => 'placeholder'],
        'placeholder-facebook' => ['title' => 'Facebook', 'type' => 'placeholder'],
        'placeholder-nextdoor' => ['title' => 'Nextdoor', 'type' => 'placeholder'],
        'placeholder-google' => ['title' => 'Google', 'type' => 'placeholder'],
        'placeholder-webhooks' => ['title' => 'Webhooks', 'type' => 'placeholder'],
        'placeholder-telephone' => ['title' => 'Telephone', 'type' => 'placeholder'],
        'placeholder-weather' => ['title' => 'Weather', 'type' => 'placeholder'],
    ];
}

function build_admin_console_image_visibility(array $image): string {
    if (trim((string) ($image['visible_on_page'] ?? '')) !== '') {
        return trim((string) $image['visible_on_page']);
    }

    $tags = isset($image['tags']) && is_array($image['tags']) ? $image['tags'] : [];
    if ($tags === []) {
        return 'Shared library';
    }

    return implode(', ', array_map('format_image_library_tag_label', array_slice($tags, 0, 4)));
}