<?php

require_once __DIR__ . '/../features/integrations/catalog.php';

function get_integrations_storage_path(): string {
    return __DIR__ . '/../../data/integrations/registry.json';
}

function ensure_integrations_storage_directory(): void {
    $directory = dirname(get_integrations_storage_path());
    if (!is_dir($directory)) {
        mkdir($directory, 0775, true);
    }
}

function get_seed_integrations_dataset(): array {
    return [
        'custom_services' => [],
        'integrations' => [
            [
                'id' => 'int-1',
                'name' => 'Lead capture webhook',
                'service_key' => 'grok',
                'service_label' => 'Grok',
                'type_key' => 'webhook',
                'type_label' => 'Webhook',
                'summary' => 'lead.created, lead.updated',
                'data_json' => json_encode(get_integration_type_data_templates()['webhook'], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES),
                'updated_at' => '2026-04-24 10:10:00',
            ],
            [
                'id' => 'int-2',
                'name' => 'Analytics dashboard tag',
                'service_key' => 'analytics',
                'service_label' => 'Analytics',
                'type_key' => 'snippet',
                'type_label' => 'Snippet',
                'summary' => 'head placement',
                'data_json' => json_encode(get_integration_type_data_templates()['snippet'], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES),
                'updated_at' => '2026-04-24 09:35:00',
            ],
            [
                'id' => 'int-3',
                'name' => 'Nextdoor access',
                'service_key' => 'nextdoor',
                'service_label' => 'Nextdoor',
                'type_key' => 'credentials',
                'type_label' => 'Credentials',
                'summary' => 'Username and password',
                'data_json' => json_encode(get_integration_type_data_templates()['credentials'], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES),
                'updated_at' => '2026-04-23 16:00:00',
            ],
        ],
    ];
}

function load_integrations_dataset(): array {
    ensure_integrations_storage_directory();
    $path = get_integrations_storage_path();

    if (!is_file($path)) {
        $seed = get_seed_integrations_dataset();
        file_put_contents($path, json_encode($seed, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
        return $seed;
    }

    $decoded = json_decode((string) file_get_contents($path), true);
    if (!is_array($decoded)) {
        $decoded = [];
    }

    return [
        'custom_services' => isset($decoded['custom_services']) && is_array($decoded['custom_services']) ? array_values($decoded['custom_services']) : [],
        'integrations' => isset($decoded['integrations']) && is_array($decoded['integrations']) ? array_values($decoded['integrations']) : get_seed_integrations_dataset()['integrations'],
    ];
}

function save_integrations_dataset(array $dataset): void {
    ensure_integrations_storage_directory();
    file_put_contents(get_integrations_storage_path(), json_encode($dataset, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
}

function get_integration_service_catalog(array $customServices = []): array {
    $catalog = get_base_integration_service_catalog();
    foreach ($customServices as $customService) {
        $slug = integration_slugify((string) $customService);
        if ($slug === '') {
            continue;
        }

        $catalog[$slug] = trim((string) $customService);
    }

    return $catalog;
}

function get_integration_records(): array {
    $dataset = load_integrations_dataset();
    $records = $dataset['integrations'];

    usort($records, static function (array $left, array $right): int {
        return strcmp((string) ($right['updated_at'] ?? ''), (string) ($left['updated_at'] ?? ''));
    });

    return $records;
}

function get_integration_record_by_id(string $id): ?array {
    foreach (get_integration_records() as $record) {
        if ((string) ($record['id'] ?? '') === $id) {
            return $record;
        }
    }

    return null;
}

function get_integration_table_rows(): array {
    $rows = [];
    foreach (get_integration_records() as $record) {
        $rows[] = [
            'id' => (string) ($record['id'] ?? ''),
            'name' => (string) ($record['name'] ?? ''),
            'service' => (string) ($record['service_label'] ?? ''),
            'type' => (string) ($record['type_label'] ?? ''),
            'summary' => (string) ($record['summary'] ?? ''),
            'updated_at' => (string) ($record['updated_at'] ?? ''),
        ];
    }

    return $rows;
}

function build_integration_summary_text(string $typeKey, array $payload): string {
    switch ($typeKey) {
        case 'snippet':
            return trim((string) ($payload['placement'] ?? 'snippet placement'));
        case 'webhook':
            $eventTypes = isset($payload['event_types']) && is_array($payload['event_types']) ? $payload['event_types'] : [];
            return $eventTypes !== [] ? implode(', ', $eventTypes) : 'Webhook endpoint';
        case 'api-keys':
            return trim((string) ($payload['label'] ?? 'API key stored'));
        case 'credentials':
            return 'Username and password';
        case 'passkeys':
            return trim((string) ($payload['key_id'] ?? 'Passkey stored'));
        case 'wireframes':
            return trim((string) ($payload['title'] ?? 'Wireframe notes'));
        default:
            return 'Integration data';
    }
}

function validate_integration_data_payload(string $typeKey, string $dataJson): array {
    $decoded = json_decode($dataJson, true);
    if (!is_array($decoded)) {
        throw new InvalidArgumentException('Integration data must be valid JSON.');
    }

    switch ($typeKey) {
        case 'snippet':
            if (trim((string) ($decoded['content'] ?? '')) === '') {
                throw new InvalidArgumentException('Snippet data must include content.');
            }
            break;
        case 'webhook':
            if (trim((string) ($decoded['endpoint'] ?? '')) === '') {
                throw new InvalidArgumentException('Webhook data must include an endpoint.');
            }
            if (!isset($decoded['event_types']) || !is_array($decoded['event_types']) || $decoded['event_types'] === []) {
                throw new InvalidArgumentException('Webhook data must include event_types as an array.');
            }
            break;
        case 'api-keys':
            if (trim((string) ($decoded['api_key'] ?? '')) === '') {
                throw new InvalidArgumentException('API key data must include api_key.');
            }
            break;
        case 'credentials':
            if (trim((string) ($decoded['username'] ?? '')) === '' || trim((string) ($decoded['password'] ?? '')) === '') {
                throw new InvalidArgumentException('Credentials data must include username and password.');
            }
            break;
        case 'passkeys':
            if (trim((string) ($decoded['key_id'] ?? '')) === '' || trim((string) ($decoded['public_key'] ?? '')) === '') {
                throw new InvalidArgumentException('Passkeys data must include key_id and public_key.');
            }
            break;
        case 'wireframes':
            if (trim((string) ($decoded['title'] ?? '')) === '' && trim((string) ($decoded['notes'] ?? '')) === '') {
                throw new InvalidArgumentException('Wireframes data must include title or notes.');
            }
            break;
        default:
            throw new InvalidArgumentException('Choose a valid integration type.');
    }

    return $decoded;
}

function save_integration_record(array $input): array {
    $dataset = load_integrations_dataset();
    $records = isset($dataset['integrations']) && is_array($dataset['integrations']) ? $dataset['integrations'] : [];
    $customServices = isset($dataset['custom_services']) && is_array($dataset['custom_services']) ? $dataset['custom_services'] : [];

    $id = trim((string) ($input['id'] ?? ''));
    $name = trim((string) ($input['name'] ?? ''));
    $serviceKey = trim((string) ($input['service_key'] ?? ''));
    $customServiceLabel = trim((string) ($input['custom_service_label'] ?? ''));
    $typeKey = trim((string) ($input['type_key'] ?? ''));
    $dataJson = trim((string) ($input['data_json'] ?? ''));

    if ($name === '') {
        throw new InvalidArgumentException('Integration name is required.');
    }

    if ($serviceKey === '__custom__') {
        if ($customServiceLabel === '') {
            throw new InvalidArgumentException('Enter a custom service name.');
        }

        $serviceKey = integration_slugify($customServiceLabel);
        if ($serviceKey === '') {
            throw new InvalidArgumentException('Enter a valid custom service name.');
        }

        $customServices[] = $customServiceLabel;
        $customServices = array_values(array_unique(array_filter(array_map('trim', $customServices))));
    }

    $serviceCatalog = get_integration_service_catalog($customServices);
    if (!isset($serviceCatalog[$serviceKey])) {
        throw new InvalidArgumentException('Choose a valid integration service.');
    }

    $typeCatalog = get_integration_type_catalog();
    if (!isset($typeCatalog[$typeKey])) {
        throw new InvalidArgumentException('Choose a valid integration type.');
    }

    if ($dataJson === '') {
        throw new InvalidArgumentException('Integration data is required.');
    }

    $payload = validate_integration_data_payload($typeKey, $dataJson);
    $record = [
        'id' => $id !== '' ? $id : 'int-' . bin2hex(random_bytes(4)),
        'name' => $name,
        'service_key' => $serviceKey,
        'service_label' => (string) $serviceCatalog[$serviceKey],
        'type_key' => $typeKey,
        'type_label' => (string) $typeCatalog[$typeKey],
        'summary' => build_integration_summary_text($typeKey, $payload),
        'data_json' => json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES),
        'updated_at' => date('Y-m-d H:i:s'),
    ];

    $saved = false;
    foreach ($records as $index => $existingRecord) {
        if ((string) ($existingRecord['id'] ?? '') !== $record['id']) {
            continue;
        }

        $records[$index] = array_merge($existingRecord, $record);
        $saved = true;
        break;
    }

    if (!$saved) {
        $records[] = $record;
    }

    $dataset['custom_services'] = $customServices;
    $dataset['integrations'] = $records;
    save_integrations_dataset($dataset);

    return $record;
}

function delete_integration_record(string $id): void {
    $dataset = load_integrations_dataset();
    $records = isset($dataset['integrations']) && is_array($dataset['integrations']) ? $dataset['integrations'] : [];

    foreach ($records as $index => $record) {
        if ((string) ($record['id'] ?? '') !== $id) {
            continue;
        }

        array_splice($records, $index, 1);
        $dataset['integrations'] = $records;
        save_integrations_dataset($dataset);
        return;
    }

    throw new InvalidArgumentException('Integration record not found.');
}

function get_integration_dashboard_summary(): array {
    $records = get_integration_records();
    $serviceCounts = [];
    $typeCounts = [];

    foreach ($records as $record) {
        $serviceKey = (string) ($record['service_key'] ?? 'unknown');
        $serviceLabel = (string) ($record['service_label'] ?? $serviceKey);
        $typeKey = (string) ($record['type_key'] ?? 'unknown');
        $typeLabel = (string) ($record['type_label'] ?? $typeKey);

        if (!isset($serviceCounts[$serviceKey])) {
            $serviceCounts[$serviceKey] = ['key' => $serviceKey, 'label' => $serviceLabel, 'count' => 0];
        }
        if (!isset($typeCounts[$typeKey])) {
            $typeCounts[$typeKey] = ['key' => $typeKey, 'label' => $typeLabel, 'count' => 0];
        }

        $serviceCounts[$serviceKey]['count']++;
        $typeCounts[$typeKey]['count']++;
    }

    usort($serviceCounts, static function (array $left, array $right): int {
        return $right['count'] <=> $left['count'];
    });
    usort($typeCounts, static function (array $left, array $right): int {
        return $right['count'] <=> $left['count'];
    });

    return [
        'total_integrations' => count($records),
        'services_in_use' => count($serviceCounts),
        'types_in_use' => count($typeCounts),
        'service_counts' => $serviceCounts,
        'type_counts' => $typeCounts,
    ];
}
