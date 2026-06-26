<?php

require_once __DIR__ . '/../features/crm/leads.php';
require_once __DIR__ . '/customers.php';

function get_leads_storage_path(): string {
    return __DIR__ . '/../../data/leads.json';
}

function ensure_leads_storage_directory(): void {
    $directory = dirname(get_leads_storage_path());

    if (!is_dir($directory)) {
        mkdir($directory, 0775, true);
    }
}

function get_seed_leads_dataset(): array {
    return [
        'leads' => [
            [
                'id' => 'lead-rivera-deck',
                'name' => 'Rivera Residence',
                'status' => 'new',
                'service_key' => 'deck-repair',
                'customer_id' => 'customer-rivera',
                'phone' => '(512) 555-0142',
                'source' => 'text',
                'location' => 'Lakeway',
                'notes' => 'Loose railing and a few soft deck boards. Sent photos by text.',
                'activity' => [
                    [
                        'id' => 'activity-rivera-1',
                        'type' => 'system',
                        'message' => 'Lead created from incoming text with photos.',
                        'created_at' => '2026-04-24 08:15:00',
                    ],
                ],
                'created_at' => '2026-04-24 08:15:00',
                'updated_at' => '2026-04-24 08:15:00',
            ],
            [
                'id' => 'lead-murphy-tv',
                'name' => 'Murphy Living Room',
                'status' => 'quoted',
                'service_key' => 'tv-mounting',
                'customer_id' => 'customer-murphy',
                'phone' => '(512) 555-0188',
                'source' => 'website',
                'location' => 'Austin',
                'notes' => '55-inch mount over fireplace. Waiting on scheduling reply.',
                'activity' => [
                    [
                        'id' => 'activity-murphy-1',
                        'type' => 'manual',
                        'message' => 'Quote sent and asked customer for preferred install dates.',
                        'created_at' => '2026-04-24 09:20:00',
                    ],
                ],
                'created_at' => '2026-04-23 16:40:00',
                'updated_at' => '2026-04-24 09:20:00',
            ],
            [
                'id' => 'lead-northloop-general',
                'name' => 'North Loop Make-Ready',
                'status' => 'contacted',
                'service_key' => '',
                'customer_id' => '',
                'phone' => '(512) 555-0111',
                'source' => 'referral',
                'location' => 'North Loop',
                'notes' => 'Small punch list across drywall, painting, and door adjustments.',
                'activity' => [
                    [
                        'id' => 'activity-northloop-1',
                        'type' => 'manual',
                        'message' => 'Called back and requested a consolidated scope list from owner.',
                        'created_at' => '2026-04-24 07:55:00',
                    ],
                ],
                'created_at' => '2026-04-22 12:05:00',
                'updated_at' => '2026-04-24 07:55:00',
            ],
        ],
    ];
}

function normalize_lead_activity_entries($entries): array {
    if (!is_array($entries)) {
        return [];
    }

    $normalized = [];
    foreach ($entries as $entry) {
        if (!is_array($entry)) {
            continue;
        }

        $message = trim((string) ($entry['message'] ?? ''));
        if ($message === '') {
            continue;
        }

        $normalized[] = [
            'id' => trim((string) ($entry['id'] ?? 'activity-' . bin2hex(random_bytes(4)))),
            'type' => trim((string) ($entry['type'] ?? 'manual')) ?: 'manual',
            'message' => $message,
            'created_at' => trim((string) ($entry['created_at'] ?? date('Y-m-d H:i:s'))),
        ];
    }

    return $normalized;
}

function normalize_lead_record(array $record): array {
    return array_merge(build_blank_lead_record(), $record, [
        'status' => (string) ($record['status'] ?? 'new'),
        'service_key' => trim((string) ($record['service_key'] ?? '')),
        'customer_id' => trim((string) ($record['customer_id'] ?? '')),
        'phone' => trim((string) ($record['phone'] ?? '')),
        'source' => trim((string) ($record['source'] ?? 'website')),
        'location' => trim((string) ($record['location'] ?? '')),
        'notes' => trim((string) ($record['notes'] ?? '')),
        'activity' => normalize_lead_activity_entries($record['activity'] ?? []),
        'activity_note' => '',
    ]);
}

function load_leads_dataset(): array {
    ensure_leads_storage_directory();
    $path = get_leads_storage_path();

    if (!is_file($path)) {
        $seed = get_seed_leads_dataset();
        file_put_contents($path, json_encode($seed, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
        return $seed;
    }

    $decoded = json_decode((string) file_get_contents($path), true);
    if (!is_array($decoded) || !isset($decoded['leads']) || !is_array($decoded['leads'])) {
        $seed = get_seed_leads_dataset();
        file_put_contents($path, json_encode($seed, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
        return $seed;
    }

    $decoded['leads'] = array_values(array_map('normalize_lead_record', $decoded['leads']));

    return $decoded;
}

function save_leads_dataset(array $dataset): void {
    ensure_leads_storage_directory();
    file_put_contents(get_leads_storage_path(), json_encode($dataset, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
}

function get_lead_records(): array {
    $dataset = load_leads_dataset();
    $records = $dataset['leads'];

    usort($records, static function (array $left, array $right): int {
        return strcmp((string) ($right['updated_at'] ?? ''), (string) ($left['updated_at'] ?? ''));
    });

    return $records;
}

function get_lead_record_by_id(string $id): ?array {
    foreach (get_lead_records() as $record) {
        if ((string) ($record['id'] ?? '') === $id) {
            return $record;
        }
    }

    return null;
}

function validate_crm_lead_status(string $status): string {
    $options = get_crm_lead_status_options();

    if (!isset($options[$status])) {
        throw new InvalidArgumentException('Choose a valid lead status.');
    }

    return $status;
}

function validate_crm_lead_source(string $source): string {
    $options = get_crm_lead_source_options();

    if (!isset($options[$source])) {
        throw new InvalidArgumentException('Choose a valid lead source.');
    }

    return $source;
}

function validate_crm_lead_service(string $serviceKey): string {
    $options = get_crm_lead_service_options();

    if (!array_key_exists($serviceKey, $options)) {
        throw new InvalidArgumentException('Choose a valid service.');
    }

    return $serviceKey;
}

function validate_crm_lead_customer(string $customerId): string {
    if ($customerId === '') {
        return '';
    }

    if (get_customer_record_by_id($customerId) === null) {
        throw new InvalidArgumentException('Choose a valid customer.');
    }

    return $customerId;
}

function build_lead_activity_entry(string $message, string $type, ?string $timestamp = null): array {
    return [
        'id' => 'activity-' . bin2hex(random_bytes(5)),
        'type' => $type,
        'message' => trim($message),
        'created_at' => $timestamp ?? date('Y-m-d H:i:s'),
    ];
}

function create_customer_record_from_lead(array $leadInput): array {
    return save_customer_record([
        'customer_name' => trim((string) ($leadInput['name'] ?? '')),
        'customer_status' => 'active',
        'customer_phone' => trim((string) ($leadInput['phone'] ?? '')),
        'customer_location' => trim((string) ($leadInput['location'] ?? '')),
        'customer_notes' => trim((string) ($leadInput['notes'] ?? '')),
    ]);
}

function save_lead_record(array $input): array {
    $dataset = load_leads_dataset();
    $records = $dataset['leads'];
    $id = trim((string) ($input['id'] ?? ''));
    $existing = $id !== '' ? get_lead_record_by_id($id) : null;

    $name = trim((string) ($input['name'] ?? ''));
    $status = validate_crm_lead_status(trim((string) ($input['status'] ?? 'new')));
    $serviceKey = validate_crm_lead_service(trim((string) ($input['service_key'] ?? '')));
    $customerId = validate_crm_lead_customer(trim((string) ($input['customer_id'] ?? '')));
    $phone = trim((string) ($input['phone'] ?? ''));
    $source = validate_crm_lead_source(trim((string) ($input['source'] ?? 'website')));
    $location = trim((string) ($input['location'] ?? ''));
    $notes = trim((string) ($input['notes'] ?? ''));
    $activityNote = trim((string) ($input['activity_note'] ?? ''));

    if ($name === '') {
        throw new InvalidArgumentException('Lead name is required.');
    }

    $timestamp = date('Y-m-d H:i:s');
    $activity = normalize_lead_activity_entries($existing['activity'] ?? []);

    if ($existing === null) {
        $activity[] = build_lead_activity_entry('Lead created.', 'system', $timestamp);
    }

    if ($existing !== null && (string) ($existing['status'] ?? '') !== $status) {
        $fromLabel = get_crm_lead_status_options()[(string) ($existing['status'] ?? '')] ?? 'Unknown';
        $toLabel = get_crm_lead_status_options()[$status] ?? 'Unknown';
        $activity[] = build_lead_activity_entry('Status changed from ' . $fromLabel . ' to ' . $toLabel . '.', 'system', $timestamp);
    }

    if ($existing !== null && (string) ($existing['customer_id'] ?? '') !== $customerId && $customerId !== '') {
        $customerRecord = get_customer_record_by_id($customerId);
        $customerName = (string) ($customerRecord['name'] ?? 'customer');
        $activity[] = build_lead_activity_entry('Linked to customer record: ' . $customerName . '.', 'system', $timestamp);
    }

    if ($status === 'booked' && $customerId === '') {
        $createdCustomer = create_customer_record_from_lead([
            'name' => $name,
            'phone' => $phone,
            'location' => $location,
            'notes' => $notes,
        ]);
        $customerId = (string) ($createdCustomer['id'] ?? '');

        if ($customerId !== '') {
            $activity[] = build_lead_activity_entry('Auto-created customer record: ' . (string) ($createdCustomer['name'] ?? 'Customer') . '.', 'system', $timestamp);
        }
    }

    if ($activityNote !== '') {
        $activity[] = build_lead_activity_entry($activityNote, 'manual', $timestamp);
    }

    $record = [
        'id' => $id !== '' ? $id : bin2hex(random_bytes(8)),
        'name' => $name,
        'status' => $status,
        'service_key' => $serviceKey,
        'customer_id' => $customerId,
        'phone' => $phone,
        'source' => $source,
        'location' => $location,
        'notes' => $notes,
        'activity' => $activity,
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

    $dataset['leads'] = $records;
    save_leads_dataset($dataset);

    return $record;
}

function update_lead_record_status(string $id, string $status): array {
    $record = get_lead_record_by_id($id);
    if ($record === null) {
        throw new InvalidArgumentException('That lead could not be found.');
    }

    return save_lead_record([
        'id' => $id,
        'name' => (string) ($record['name'] ?? ''),
        'status' => $status,
        'service_key' => (string) ($record['service_key'] ?? ''),
        'customer_id' => (string) ($record['customer_id'] ?? ''),
        'phone' => (string) ($record['phone'] ?? ''),
        'source' => (string) ($record['source'] ?? 'website'),
        'location' => (string) ($record['location'] ?? ''),
        'notes' => (string) ($record['notes'] ?? ''),
    ]);
}

function delete_lead_record(string $id): void {
    $dataset = load_leads_dataset();
    $records = $dataset['leads'];

    foreach ($records as $index => $record) {
        if ((string) ($record['id'] ?? '') !== $id) {
            continue;
        }

        array_splice($records, $index, 1);
        $dataset['leads'] = $records;
        save_leads_dataset($dataset);
        return;
    }

    throw new InvalidArgumentException('That lead could not be found.');
}