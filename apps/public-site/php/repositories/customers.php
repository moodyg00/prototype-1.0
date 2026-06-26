<?php

require_once __DIR__ . '/../features/crm/customers.php';
require_once __DIR__ . '/jobs.php';
require_once __DIR__ . '/leads.php';

function get_customers_storage_path(): string {
    return __DIR__ . '/../../data/customers.json';
}

function ensure_customers_storage_directory(): void {
    $directory = dirname(get_customers_storage_path());

    if (!is_dir($directory)) {
        mkdir($directory, 0775, true);
    }
}

function get_seed_customers_dataset(): array {
    return [
        'customers' => [
            [
                'id' => 'customer-rivera',
                'name' => 'Rivera Residence',
                'status' => 'active',
                'phone' => '(512) 555-0142',
                'email' => 'rivera@example.com',
                'location' => 'Lakeway',
                'notes' => 'Prefers text updates and usually sends project photos first.',
                'created_at' => '2026-04-20 09:10:00',
                'updated_at' => '2026-04-24 08:15:00',
            ],
            [
                'id' => 'customer-murphy',
                'name' => 'Murphy Living Room',
                'status' => 'prospect',
                'phone' => '(512) 555-0188',
                'email' => 'murphy@example.com',
                'location' => 'Austin',
                'notes' => 'Quote sent for fireplace TV mount.',
                'created_at' => '2026-04-23 16:35:00',
                'updated_at' => '2026-04-24 09:20:00',
            ],
        ],
    ];
}

function normalize_customer_record(array $record): array {
    return array_merge(build_blank_customer_record(), $record, [
        'status' => (string) ($record['status'] ?? 'prospect'),
        'phone' => trim((string) ($record['phone'] ?? '')),
        'email' => trim((string) ($record['email'] ?? '')),
        'location' => trim((string) ($record['location'] ?? '')),
        'notes' => trim((string) ($record['notes'] ?? '')),
    ]);
}

function load_customers_dataset(): array {
    ensure_customers_storage_directory();
    $path = get_customers_storage_path();

    if (!is_file($path)) {
        $seed = get_seed_customers_dataset();
        file_put_contents($path, json_encode($seed, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
        return $seed;
    }

    $decoded = json_decode((string) file_get_contents($path), true);
    if (!is_array($decoded) || !isset($decoded['customers']) || !is_array($decoded['customers'])) {
        $seed = get_seed_customers_dataset();
        file_put_contents($path, json_encode($seed, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
        return $seed;
    }

    $decoded['customers'] = array_values(array_map('normalize_customer_record', $decoded['customers']));

    return $decoded;
}

function save_customers_dataset(array $dataset): void {
    ensure_customers_storage_directory();
    file_put_contents(get_customers_storage_path(), json_encode($dataset, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
}

function get_customer_records(): array {
    $dataset = load_customers_dataset();
    $records = $dataset['customers'];

    usort($records, static function (array $left, array $right): int {
        return strcmp((string) ($right['updated_at'] ?? ''), (string) ($left['updated_at'] ?? ''));
    });

    return $records;
}

function get_customer_record_by_id(string $id): ?array {
    foreach (get_customer_records() as $record) {
        if ((string) ($record['id'] ?? '') === $id) {
            return $record;
        }
    }

    return null;
}

function validate_crm_customer_status(string $status): string {
    $options = get_crm_customer_status_options();

    if (!isset($options[$status])) {
        throw new InvalidArgumentException('Choose a valid customer status.');
    }

    return $status;
}

function save_customer_record(array $input): array {
    $dataset = load_customers_dataset();
    $records = $dataset['customers'];
    $id = trim((string) ($input['customer_id'] ?? $input['id'] ?? ''));
    $existing = $id !== '' ? get_customer_record_by_id($id) : null;

    $name = trim((string) ($input['customer_name'] ?? $input['name'] ?? ''));
    $status = validate_crm_customer_status(trim((string) ($input['customer_status'] ?? $input['status'] ?? 'prospect')));
    $phone = trim((string) ($input['customer_phone'] ?? $input['phone'] ?? ''));
    $email = trim((string) ($input['customer_email'] ?? $input['email'] ?? ''));
    $location = trim((string) ($input['customer_location'] ?? $input['location'] ?? ''));
    $notes = trim((string) ($input['customer_notes'] ?? $input['notes'] ?? ''));

    if ($name === '') {
        throw new InvalidArgumentException('Customer name is required.');
    }

    $timestamp = date('Y-m-d H:i:s');
    $record = [
        'id' => $id !== '' ? $id : 'customer-' . bin2hex(random_bytes(5)),
        'name' => $name,
        'status' => $status,
        'phone' => $phone,
        'email' => $email,
        'location' => $location,
        'notes' => $notes,
        'created_at' => (string) ($existing['created_at'] ?? $timestamp),
        'updated_at' => $timestamp,
    ];

    $saved = false;
    foreach ($records as $index => $existingRecord) {
        if ((string) ($existingRecord['id'] ?? '') !== $record['id']) {
            continue;
        }

        $records[$index] = $record;
        $saved = true;
        break;
    }

    if (!$saved) {
        $records[] = $record;
    }

    $dataset['customers'] = $records;
    save_customers_dataset($dataset);

    return $record;
}

function update_customer_record_status(string $id, string $status): array {
    $record = get_customer_record_by_id($id);
    if ($record === null) {
        throw new InvalidArgumentException('That customer could not be found.');
    }

    return save_customer_record([
        'customer_id' => $id,
        'customer_name' => (string) ($record['name'] ?? ''),
        'customer_status' => $status,
        'customer_phone' => (string) ($record['phone'] ?? ''),
        'customer_email' => (string) ($record['email'] ?? ''),
        'customer_location' => (string) ($record['location'] ?? ''),
        'customer_notes' => (string) ($record['notes'] ?? ''),
    ]);
}

function delete_customer_record(string $id): void {
    foreach (get_lead_records() as $leadRecord) {
        if ((string) ($leadRecord['customer_id'] ?? '') === $id) {
            throw new InvalidArgumentException('This customer is still linked to one or more leads. Remove those links first.');
        }
    }

    foreach (get_job_records() as $jobRecord) {
        if ((string) ($jobRecord['customer_id'] ?? '') === $id) {
            throw new InvalidArgumentException('This customer is still linked to one or more jobs. Remove those links first.');
        }
    }

    $dataset = load_customers_dataset();
    $records = $dataset['customers'];

    foreach ($records as $index => $record) {
        if ((string) ($record['id'] ?? '') !== $id) {
            continue;
        }

        array_splice($records, $index, 1);
        $dataset['customers'] = $records;
        save_customers_dataset($dataset);
        return;
    }

    throw new InvalidArgumentException('That customer could not be found.');
}