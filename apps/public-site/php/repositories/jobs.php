<?php

require_once __DIR__ . '/../features/crm/jobs.php';
require_once __DIR__ . '/customers.php';
require_once __DIR__ . '/leads.php';

function get_jobs_storage_path(): string {
    return __DIR__ . '/../../data/jobs.json';
}

function ensure_jobs_storage_directory(): void {
    $directory = dirname(get_jobs_storage_path());

    if (!is_dir($directory)) {
        mkdir($directory, 0775, true);
    }
}

function get_seed_jobs_dataset(): array {
    return [
        'jobs' => [
            [
                'id' => 'job-rivera-deck',
                'title' => 'Rivera deck repair visit',
                'status' => 'scheduled',
                'service_key' => 'deck-repair',
                'customer_id' => 'customer-rivera',
                'lead_id' => 'lead-rivera-deck',
                'location' => 'Lakeway',
                'scheduled_for' => '2026-04-26T10:00',
                'notes' => 'Inspect railing, replace soft boards, confirm stain match on site.',
                'created_at' => '2026-04-24 08:20:00',
                'updated_at' => '2026-04-24 08:20:00',
            ],
            [
                'id' => 'job-northloop-makeready',
                'title' => 'North Loop make-ready walkthrough',
                'status' => 'on-hold',
                'service_key' => '',
                'customer_id' => '',
                'lead_id' => 'lead-northloop-general',
                'location' => 'North Loop',
                'scheduled_for' => '',
                'notes' => 'Waiting on final owner approval before scheduling multi-trade work.',
                'created_at' => '2026-04-24 07:58:00',
                'updated_at' => '2026-04-24 07:58:00',
            ],
        ],
    ];
}

function normalize_job_record(array $record): array {
    return array_merge(build_blank_job_record(), $record, [
        'status' => (string) ($record['status'] ?? 'scheduled'),
        'service_key' => trim((string) ($record['service_key'] ?? '')),
        'customer_id' => trim((string) ($record['customer_id'] ?? '')),
        'lead_id' => trim((string) ($record['lead_id'] ?? '')),
        'location' => trim((string) ($record['location'] ?? '')),
        'scheduled_for' => trim((string) ($record['scheduled_for'] ?? '')),
        'notes' => trim((string) ($record['notes'] ?? '')),
    ]);
}

function load_jobs_dataset(): array {
    ensure_jobs_storage_directory();
    $path = get_jobs_storage_path();

    if (!is_file($path)) {
        $seed = get_seed_jobs_dataset();
        file_put_contents($path, json_encode($seed, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
        return $seed;
    }

    $decoded = json_decode((string) file_get_contents($path), true);
    if (!is_array($decoded) || !isset($decoded['jobs']) || !is_array($decoded['jobs'])) {
        $seed = get_seed_jobs_dataset();
        file_put_contents($path, json_encode($seed, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
        return $seed;
    }

    $decoded['jobs'] = array_values(array_map('normalize_job_record', $decoded['jobs']));

    return $decoded;
}

function save_jobs_dataset(array $dataset): void {
    ensure_jobs_storage_directory();
    file_put_contents(get_jobs_storage_path(), json_encode($dataset, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
}

function get_job_records(): array {
    $dataset = load_jobs_dataset();
    $records = $dataset['jobs'];

    usort($records, static function (array $left, array $right): int {
        return strcmp((string) ($right['updated_at'] ?? ''), (string) ($left['updated_at'] ?? ''));
    });

    return $records;
}

function get_job_record_by_id(string $id): ?array {
    foreach (get_job_records() as $record) {
        if ((string) ($record['id'] ?? '') === $id) {
            return $record;
        }
    }

    return null;
}

function get_job_records_by_lead_id(string $leadId, string $excludeJobId = ''): array {
    if ($leadId === '') {
        return [];
    }

    $matches = [];
    foreach (get_job_records() as $record) {
        if ((string) ($record['lead_id'] ?? '') !== $leadId) {
            continue;
        }

        if ($excludeJobId !== '' && (string) ($record['id'] ?? '') === $excludeJobId) {
            continue;
        }

        $matches[] = $record;
    }

    return $matches;
}

function validate_crm_job_status(string $status): string {
    $options = get_crm_job_status_options();

    if (!isset($options[$status])) {
        throw new InvalidArgumentException('Choose a valid job status.');
    }

    return $status;
}

function validate_crm_job_service(string $serviceKey): string {
    $options = get_crm_job_service_options();

    if (!array_key_exists($serviceKey, $options)) {
        throw new InvalidArgumentException('Choose a valid job service.');
    }

    return $serviceKey;
}

function validate_crm_job_customer(string $customerId): string {
    if ($customerId === '') {
        return '';
    }

    if (get_customer_record_by_id($customerId) === null) {
        throw new InvalidArgumentException('Choose a valid customer.');
    }

    return $customerId;
}

function validate_crm_job_lead(string $leadId): string {
    if ($leadId === '') {
        return '';
    }

    if (get_lead_record_by_id($leadId) === null) {
        throw new InvalidArgumentException('Choose a valid lead.');
    }

    return $leadId;
}

function save_job_record(array $input): array {
    $dataset = load_jobs_dataset();
    $records = $dataset['jobs'];
    $id = trim((string) ($input['job_id'] ?? $input['id'] ?? ''));
    $existing = $id !== '' ? get_job_record_by_id($id) : null;

    $title = trim((string) ($input['job_title'] ?? $input['title'] ?? ''));
    $status = validate_crm_job_status(trim((string) ($input['job_status'] ?? $input['status'] ?? 'scheduled')));
    $serviceKey = validate_crm_job_service(trim((string) ($input['job_service_key'] ?? $input['service_key'] ?? '')));
    $customerId = validate_crm_job_customer(trim((string) ($input['job_customer_id'] ?? $input['customer_id'] ?? '')));
    $leadId = validate_crm_job_lead(trim((string) ($input['job_lead_id'] ?? $input['lead_id'] ?? '')));
    $location = trim((string) ($input['job_location'] ?? $input['location'] ?? ''));
    $scheduledFor = trim((string) ($input['job_scheduled_for'] ?? $input['scheduled_for'] ?? ''));
    $notes = trim((string) ($input['job_notes'] ?? $input['notes'] ?? ''));
    $allowDuplicateForLead = trim((string) ($input['allow_duplicate_for_lead'] ?? ''));

    if ($title === '') {
        throw new InvalidArgumentException('Job title is required.');
    }

    if ($id === '' && $leadId !== '' && !empty(get_job_records_by_lead_id($leadId)) && $allowDuplicateForLead !== '1') {
        throw new InvalidArgumentException('A job already exists for this lead. Check the duplicate-job box to create another one.');
    }

    $timestamp = date('Y-m-d H:i:s');
    $record = [
        'id' => $id !== '' ? $id : 'job-' . bin2hex(random_bytes(5)),
        'title' => $title,
        'status' => $status,
        'service_key' => $serviceKey,
        'customer_id' => $customerId,
        'lead_id' => $leadId,
        'location' => $location,
        'scheduled_for' => $scheduledFor,
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

    $dataset['jobs'] = $records;
    save_jobs_dataset($dataset);

    return $record;
}

function update_job_record_status(string $id, string $status): array {
    $record = get_job_record_by_id($id);
    if ($record === null) {
        throw new InvalidArgumentException('That job could not be found.');
    }

    return save_job_record([
        'job_id' => $id,
        'job_title' => (string) ($record['title'] ?? ''),
        'job_status' => $status,
        'job_service_key' => (string) ($record['service_key'] ?? ''),
        'job_customer_id' => (string) ($record['customer_id'] ?? ''),
        'job_lead_id' => (string) ($record['lead_id'] ?? ''),
        'job_location' => (string) ($record['location'] ?? ''),
        'job_scheduled_for' => (string) ($record['scheduled_for'] ?? ''),
        'job_notes' => (string) ($record['notes'] ?? ''),
    ]);
}

function delete_job_record(string $id): void {
    $dataset = load_jobs_dataset();
    $records = $dataset['jobs'];

    foreach ($records as $index => $record) {
        if ((string) ($record['id'] ?? '') !== $id) {
            continue;
        }

        array_splice($records, $index, 1);
        $dataset['jobs'] = $records;
        save_jobs_dataset($dataset);
        return;
    }

    throw new InvalidArgumentException('That job could not be found.');
}