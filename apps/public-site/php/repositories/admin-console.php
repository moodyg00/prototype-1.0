<?php

require_once __DIR__ . '/../features/admin-console/catalog.php';
require_once __DIR__ . '/../repositories/ads.php';
require_once __DIR__ . '/../repositories/customers.php';
require_once __DIR__ . '/../repositories/image-library.php';
require_once __DIR__ . '/../repositories/jobs.php';
require_once __DIR__ . '/../repositories/leads.php';
require_once __DIR__ . '/../services/service-catalog.php';

function get_admin_console_storage_path(): string {
    return __DIR__ . '/../../data/admin-console.json';
}

function ensure_admin_console_storage_directory(): void {
    $directory = dirname(get_admin_console_storage_path());
    if (!is_dir($directory)) {
        mkdir($directory, 0775, true);
    }
}

function get_admin_console_seed_dataset(): array {
    return [
        'invoicing' => [
            ['id' => 'inv-1007', 'title' => 'Rivera deck repair invoice', 'status' => 'sent', 'customer' => 'Rivera Residence', 'amount' => 640.00, 'service' => 'Deck Repair', 'updated_at' => '2026-04-24 09:25:00'],
            ['id' => 'inv-1006', 'title' => 'Murphy TV install invoice', 'status' => 'paid', 'customer' => 'Murphy Living Room', 'amount' => 225.00, 'service' => 'TV Mounting', 'updated_at' => '2026-04-23 18:15:00'],
            ['id' => 'inv-1005', 'title' => 'North Loop make-ready deposit', 'status' => 'draft', 'customer' => 'North Loop Make-Ready', 'amount' => 0.00, 'service' => 'General Handyman', 'updated_at' => '2026-04-23 11:00:00'],
        ],
        'operations-expenses' => [
            ['id' => 'op-exp-1', 'title' => 'Deck screws and anchors', 'status' => 'reimbursable', 'vendor' => 'Home Depot', 'amount' => 48.91, 'updated_at' => '2026-04-24 08:40:00'],
            ['id' => 'op-exp-2', 'title' => 'TV mount hardware', 'status' => 'approved', 'vendor' => 'Lowe\'s', 'amount' => 18.42, 'updated_at' => '2026-04-23 15:12:00'],
        ],
        'estimates' => [
            ['id' => 'est-1', 'title' => 'Deck rail repair estimate', 'status' => 'sent', 'customer' => 'Rivera Residence', 'amount' => 650.00, 'updated_at' => '2026-04-24 08:30:00'],
            ['id' => 'est-2', 'title' => 'Fireplace TV mount estimate', 'status' => 'approved', 'customer' => 'Murphy Living Room', 'amount' => 225.00, 'updated_at' => '2026-04-23 17:55:00'],
        ],
        'products' => [
            ['id' => 'prod-1', 'title' => 'Premium TV Mount Package', 'status' => 'active', 'sku' => 'TV-MOUNT-PRO', 'price' => 225.00, 'updated_at' => '2026-04-22 14:20:00'],
            ['id' => 'prod-2', 'title' => 'Deck Board Replacement', 'status' => 'active', 'sku' => 'DECK-BRD', 'price' => 95.00, 'updated_at' => '2026-04-22 14:15:00'],
        ],
        'blog-posts' => [
            ['id' => 'blog-1', 'title' => 'Spring exterior cleanup checklist', 'status' => 'published', 'author' => 'admin', 'updated_at' => '2026-04-20 09:00:00'],
            ['id' => 'blog-2', 'title' => 'How to know when your deck needs repair', 'status' => 'draft', 'author' => 'admin', 'updated_at' => '2026-04-18 13:15:00'],
        ],
        'accounting-expenses' => [
            ['id' => 'acct-exp-1', 'title' => 'Fuel reimbursement', 'status' => 'posted', 'account' => 'Vehicle Expense', 'amount' => 72.15, 'updated_at' => '2026-04-24 07:50:00'],
            ['id' => 'acct-exp-2', 'title' => 'Ad spend - spring promo', 'status' => 'posted', 'account' => 'Advertising', 'amount' => 180.00, 'updated_at' => '2026-04-22 16:20:00'],
        ],
        'inventory' => [
            ['id' => 'inv-item-1', 'title' => 'Universal TV mounts', 'status' => 'in-stock', 'quantity' => 6, 'updated_at' => '2026-04-24 07:10:00'],
            ['id' => 'inv-item-2', 'title' => 'Deck fastener kits', 'status' => 'low-stock', 'quantity' => 2, 'updated_at' => '2026-04-23 12:40:00'],
        ],
        'banking' => [
            ['id' => 'bank-1', 'title' => 'Stripe payout', 'status' => 'cleared', 'amount' => 512.00, 'updated_at' => '2026-04-24 06:45:00'],
            ['id' => 'bank-2', 'title' => 'Home Depot charge', 'status' => 'cleared', 'amount' => -48.91, 'updated_at' => '2026-04-24 06:40:00'],
        ],
        'chart-of-accounts' => [
            ['id' => 'coa-1', 'title' => '1000 Cash', 'status' => 'asset', 'category' => 'Asset', 'updated_at' => '2026-04-12 09:00:00'],
            ['id' => 'coa-2', 'title' => '4000 Service Revenue', 'status' => 'income', 'category' => 'Income', 'updated_at' => '2026-04-12 09:00:00'],
        ],
        'journal' => [
            ['id' => 'jrnl-1', 'title' => 'Invoice payment from Murphy', 'status' => 'posted', 'account' => 'Cash / Service Revenue', 'updated_at' => '2026-04-23 18:15:00'],
            ['id' => 'jrnl-2', 'title' => 'Deck materials purchase', 'status' => 'posted', 'account' => 'Materials Expense / Cash', 'updated_at' => '2026-04-24 08:40:00'],
        ],
        'password-reset-requests' => [],
        'page-controls' => [],
        'service-controls' => [],
    ];
}

function load_admin_console_dataset(): array {
    ensure_admin_console_storage_directory();
    $path = get_admin_console_storage_path();
    if (!is_file($path)) {
        $seed = get_admin_console_seed_dataset();
        file_put_contents($path, json_encode($seed, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
        return $seed;
    }

    $decoded = json_decode((string) file_get_contents($path), true);
    if (!is_array($decoded)) {
        $decoded = [];
    }

    return array_merge(get_admin_console_seed_dataset(), $decoded);
}

function save_admin_console_dataset(array $dataset): void {
    ensure_admin_console_storage_directory();
    file_put_contents(get_admin_console_storage_path(), json_encode($dataset, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
}

function get_admin_console_records(string $datasetKey): array {
    $dataset = load_admin_console_dataset();
    $records = $dataset[$datasetKey] ?? [];
    if (!is_array($records)) {
        return [];
    }

    usort($records, static function (array $left, array $right): int {
        return strcmp((string) ($right['updated_at'] ?? ''), (string) ($left['updated_at'] ?? ''));
    });

    return $records;
}

function get_admin_console_record_by_id(string $datasetKey, string $recordId): ?array {
    foreach (get_admin_console_records($datasetKey) as $record) {
        if ((string) ($record['id'] ?? '') === $recordId) {
            return $record;
        }
    }

    return null;
}

function save_admin_console_record(string $datasetKey, array $record): array {
    $dataset = load_admin_console_dataset();
    $records = isset($dataset[$datasetKey]) && is_array($dataset[$datasetKey]) ? $dataset[$datasetKey] : [];
    $recordId = trim((string) ($record['id'] ?? ''));
    $timestamp = date('Y-m-d H:i:s');

    $normalized = array_merge($record, [
        'id' => $recordId !== '' ? $recordId : bin2hex(random_bytes(6)),
        'updated_at' => trim((string) ($record['updated_at'] ?? '')) !== '' ? (string) $record['updated_at'] : $timestamp,
    ]);

    $saved = false;
    foreach ($records as $index => $existingRecord) {
        if ((string) ($existingRecord['id'] ?? '') !== (string) $normalized['id']) {
            continue;
        }

        $records[$index] = array_merge($existingRecord, $normalized);
        $saved = true;
        break;
    }

    if (!$saved) {
        $records[] = $normalized;
    }

    $dataset[$datasetKey] = $records;
    save_admin_console_dataset($dataset);

    return $normalized;
}

function delete_admin_console_record(string $datasetKey, string $recordId): void {
    $dataset = load_admin_console_dataset();
    $records = isset($dataset[$datasetKey]) && is_array($dataset[$datasetKey]) ? $dataset[$datasetKey] : [];

    foreach ($records as $index => $record) {
        if ((string) ($record['id'] ?? '') !== $recordId) {
            continue;
        }

        array_splice($records, $index, 1);
        $dataset[$datasetKey] = array_values($records);
        save_admin_console_dataset($dataset);
        return;
    }

    throw new InvalidArgumentException('Record not found.');
}

function get_admin_console_page_rows(): array {
    $pages = [];
    foreach (glob(__DIR__ . '/../../*.php') ?: [] as $filePath) {
        $fileName = basename($filePath);
        if ($fileName === 'blog.php') {
            $status = 'content';
        } elseif ($fileName === 'index.php') {
            $status = 'primary';
        } else {
            $status = 'active';
        }

        $pages[] = [
            'id' => pathinfo($fileName, PATHINFO_FILENAME),
            'title' => ucwords(str_replace('-', ' ', pathinfo($fileName, PATHINFO_FILENAME))),
            'status' => $status,
            'path' => $fileName,
            'updated_at' => date('Y-m-d H:i:s', filemtime($filePath) ?: time()),
        ];
    }

    usort($pages, static function (array $left, array $right): int {
        return strcmp((string) ($left['title'] ?? ''), (string) ($right['title'] ?? ''));
    });

    return $pages;
}

function get_admin_console_page_control_rows(): array {
    $records = get_admin_console_records('page-controls');
    if ($records !== []) {
        return $records;
    }

    $seedRows = get_admin_console_page_rows();
    $dataset = load_admin_console_dataset();
    $dataset['page-controls'] = $seedRows;
    save_admin_console_dataset($dataset);

    return $seedRows;
}

function get_admin_console_service_rows(): array {
    $rows = [];
    foreach (get_service_catalog() as $serviceKey => $serviceEntry) {
        $rows[] = [
            'id' => $serviceKey,
            'title' => (string) ($serviceEntry['label'] ?? $serviceKey),
            'status' => 'active',
            'path' => (string) ($serviceEntry['href'] ?? ''),
            'updated_at' => date('Y-m-d H:i:s'),
        ];
    }

    return $rows;
}

function get_admin_console_service_control_rows(): array {
    $records = get_admin_console_records('service-controls');
    if ($records !== []) {
        return $records;
    }

    $seedRows = get_admin_console_service_rows();
    $dataset = load_admin_console_dataset();
    $dataset['service-controls'] = $seedRows;
    save_admin_console_dataset($dataset);

    return $seedRows;
}

function import_admin_console_banking_csv(array $file): int {
    if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
        throw new InvalidArgumentException('Choose a CSV file to upload.');
    }

    $tmpPath = (string) ($file['tmp_name'] ?? '');
    if ($tmpPath === '' || !is_uploaded_file($tmpPath)) {
        throw new InvalidArgumentException('The CSV upload could not be verified.');
    }

    $handle = fopen($tmpPath, 'rb');
    if ($handle === false) {
        throw new RuntimeException('The CSV file could not be opened.');
    }

    $header = null;
    $rows = [];

    while (($data = fgetcsv($handle)) !== false) {
        if ($header === null) {
            $header = array_map(static function ($value): string {
                return strtolower(trim((string) $value));
            }, $data);
            continue;
        }

        $record = [];
        foreach ($header as $index => $column) {
            $record[$column] = trim((string) ($data[$index] ?? ''));
        }

        $amountValue = $record['amount'] ?? $record['debit'] ?? $record['credit'] ?? '0';
        $amount = (float) str_replace([',', '$'], '', (string) $amountValue);
        if (isset($record['debit']) && !isset($record['amount']) && $amount > 0) {
            $amount *= -1;
        }

        $title = trim((string) ($record['description'] ?? $record['memo'] ?? $record['payee'] ?? 'Bank transaction'));
        $transactionDate = trim((string) ($record['date'] ?? ''));

        $rows[] = [
            'id' => 'bank-' . bin2hex(random_bytes(4)),
            'title' => $title !== '' ? $title : 'Bank transaction',
            'status' => 'imported',
            'amount' => $amount,
            'updated_at' => $transactionDate !== '' ? date('Y-m-d H:i:s', strtotime($transactionDate) ?: time()) : date('Y-m-d H:i:s'),
        ];
    }

    fclose($handle);

    if ($rows === []) {
        throw new InvalidArgumentException('The CSV did not contain any transaction rows.');
    }

    $dataset = load_admin_console_dataset();
    $existingRows = isset($dataset['banking']) && is_array($dataset['banking']) ? $dataset['banking'] : [];
    $dataset['banking'] = array_merge($rows, $existingRows);
    save_admin_console_dataset($dataset);

    return count($rows);
}