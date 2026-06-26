<?php

require_once __DIR__ . '/../features/ads/catalog.php';

function get_ads_storage_path(): string {
    return __DIR__ . '/../../data/ads.json';
}

function ads_slugify(string $value): string {
    $normalized = strtolower(trim($value));
    $normalized = preg_replace('/[^a-z0-9]+/', '-', $normalized) ?? '';

    return trim($normalized, '-');
}

function ensure_ads_storage_directory(): void {
    $directory = dirname(get_ads_storage_path());

    if (!is_dir($directory)) {
        mkdir($directory, 0775, true);
    }
}

function load_ads_dataset(): array {
    ensure_ads_storage_directory();
    $path = get_ads_storage_path();

    if (!is_file($path)) {
        $seed = get_seed_ads_dataset();
        file_put_contents($path, json_encode($seed, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
        return $seed;
    }

    $decoded = json_decode((string) file_get_contents($path), true);
    if (!is_array($decoded) || !isset($decoded['ads']) || !is_array($decoded['ads'])) {
        $seed = get_seed_ads_dataset();
        file_put_contents($path, json_encode($seed, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
        return $seed;
    }

    return $decoded;
}

function save_ads_dataset(array $dataset): void {
    ensure_ads_storage_directory();
    file_put_contents(get_ads_storage_path(), json_encode($dataset, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
}

function get_ads_records(): array {
    $dataset = load_ads_dataset();

    return $dataset['ads'];
}

function get_ads_records_grouped(): array {
    $groups = get_ad_group_catalog();
    $grouped = [];

    foreach ($groups as $groupKey => $groupMeta) {
        $grouped[$groupKey] = [
            'group' => $groupMeta,
            'ads' => [],
        ];
    }

    foreach (get_ads_records() as $record) {
        $groupKey = (string) ($record['group_key'] ?? '');
        if (!isset($grouped[$groupKey])) {
            continue;
        }

        $grouped[$groupKey]['ads'][] = $record;
    }

    foreach ($grouped as $groupKey => $groupData) {
        usort($grouped[$groupKey]['ads'], static function (array $left, array $right): int {
            $leftDefault = !empty($left['is_default']);
            $rightDefault = !empty($right['is_default']);

            if ($leftDefault !== $rightDefault) {
                return $leftDefault ? -1 : 1;
            }

            return strcmp((string) ($left['internal_name'] ?? ''), (string) ($right['internal_name'] ?? ''));
        });
    }

    return $grouped;
}

function get_ad_record_by_id(string $id): ?array {
    foreach (get_ads_records() as $record) {
        if ((string) ($record['id'] ?? '') === $id) {
            return $record;
        }
    }

    return null;
}

function get_default_ad_record(string $groupKey): ?array {
    foreach (get_ads_records() as $record) {
        if ((string) ($record['group_key'] ?? '') === $groupKey && !empty($record['is_default'])) {
            return $record;
        }
    }

    return null;
}

function find_public_ad_record(string $groupKey, string $urlKey): ?array {
    foreach (get_ads_records() as $record) {
        if ((string) ($record['group_key'] ?? '') !== $groupKey) {
            continue;
        }

        if ((string) ($record['url_key'] ?? '') !== $urlKey) {
            continue;
        }

        if ((string) ($record['status'] ?? 'draft') !== 'active') {
            return null;
        }

        return $record;
    }

    return null;
}

function validate_ad_status(string $status): string {
    $allowed = ['active', 'draft', 'paused'];

    if (!in_array($status, $allowed, true)) {
        throw new InvalidArgumentException('Choose a valid ad status.');
    }

    return $status;
}

function assert_unique_ad_url_key(array $records, string $urlKey, string $currentId = ''): void {
    foreach ($records as $record) {
        if ((string) ($record['id'] ?? '') === $currentId) {
            continue;
        }

        if ((string) ($record['url_key'] ?? '') === $urlKey) {
            throw new InvalidArgumentException('That URL key is already in use.');
        }
    }
}

function save_ad_record(array $input): array {
    $dataset = load_ads_dataset();
    $records = $dataset['ads'];
    $groups = get_ad_group_catalog();

    $id = trim((string) ($input['id'] ?? ''));
    $groupKey = trim((string) ($input['group_key'] ?? 'index'));
    if (!isset($groups[$groupKey])) {
        throw new InvalidArgumentException('Choose a valid ad group.');
    }

    $existing = $id !== '' ? get_ad_record_by_id($id) : null;
    if (!empty($existing['is_default'])) {
        $groupKey = (string) ($existing['group_key'] ?? $groupKey);
    }

    $internalName = trim((string) ($input['internal_name'] ?? ''));
    $urlKey = ads_slugify((string) ($input['url_key'] ?? ''));
    $headline = trim((string) ($input['headline'] ?? ''));
    $problem = trim((string) ($input['problem'] ?? ''));
    $solution = trim((string) ($input['solution'] ?? ''));
    $offer = trim((string) ($input['offer'] ?? ''));
    $ctaLabel = trim((string) ($input['cta_label'] ?? ''));
    $ctaHref = trim((string) ($input['cta_href'] ?? ''));
    $imageSrc = trim((string) ($input['image_src'] ?? ''));
    $imageAlt = trim((string) ($input['image_alt'] ?? ''));
    $status = validate_ad_status(trim((string) ($input['status'] ?? 'draft')));

    if ($internalName === '') {
        throw new InvalidArgumentException('Internal name is required.');
    }

    if ($urlKey === '') {
        throw new InvalidArgumentException('URL key is required.');
    }

    if ($headline === '' || $problem === '' || $solution === '' || $offer === '') {
        throw new InvalidArgumentException('Headline, problem, solution, and offer are required.');
    }

    if ($ctaLabel === '') {
        throw new InvalidArgumentException('CTA button label is required.');
    }

    assert_unique_ad_url_key($records, $urlKey, $id);

    $timestamp = date('Y-m-d H:i:s');
    $record = [
        'id' => $id !== '' ? $id : bin2hex(random_bytes(8)),
        'group_key' => $groupKey,
        'internal_name' => $internalName,
        'url_key' => $urlKey,
        'status' => $status,
        'is_default' => !empty($existing['is_default']),
        'headline' => $headline,
        'problem' => $problem,
        'solution' => $solution,
        'offer' => $offer,
        'cta_label' => $ctaLabel,
        'cta_href' => $ctaHref,
        'image_src' => $imageSrc,
        'image_alt' => $imageAlt,
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

    $dataset['ads'] = $records;
    save_ads_dataset($dataset);

    return $record;
}

function delete_ad_record(string $id): string {
    $dataset = load_ads_dataset();
    $records = $dataset['ads'];

    foreach ($records as $index => $record) {
        if ((string) ($record['id'] ?? '') !== $id) {
            continue;
        }

        if (!empty($record['is_default'])) {
            throw new InvalidArgumentException('The default ad cannot be deleted.');
        }

        $groupKey = (string) ($record['group_key'] ?? 'index');
        array_splice($records, $index, 1);
        $dataset['ads'] = $records;
        save_ads_dataset($dataset);

        return $groupKey;
    }

    throw new InvalidArgumentException('That ad could not be found.');
}