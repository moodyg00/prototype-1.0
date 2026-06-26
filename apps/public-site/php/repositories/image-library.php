<?php

require_once __DIR__ . '/../services/service-catalog.php';
require_once __DIR__ . '/../services/image-storage.php';

function get_image_library_storage_path(): string {
    return get_image_library_dataset_path();
}

function image_library_slugify(string $value): string {
    $normalized = strtolower(trim($value));
    $normalized = preg_replace('/[^a-z0-9]+/', '-', $normalized) ?? '';

    return trim($normalized, '-');
}

function ensure_image_library_directory(string $directory): void {
    if (!is_dir($directory)) {
        mkdir($directory, 0775, true);
    }
}

function get_default_image_library_tags(): array {
    $tags = [
        'homepage',
        'ad',
        'before',
        'after',
        'interior',
        'exterior',
        'detail',
        'close-up',
        'wide-shot',
        'kitchen',
        'bathroom',
        'living-room',
        'bedroom',
        'garage',
        'yard',
        'deck',
        'fence',
        'door',
        'drywall',
        'painting',
        'appliance',
        'mounting',
        'cleaning',
        'repair',
        'installation',
    ];

    foreach (array_keys(get_service_catalog()) as $serviceKey) {
        $tags[] = $serviceKey;
    }

    $tags = array_merge($tags, get_image_library_seo_tags());

    return normalize_image_library_tags($tags);
}

function format_image_library_tag_label(string $tag): string {
    return ucwords(str_replace('-', ' ', $tag));
}

function get_image_library_seo_tags(): array {
    return [
        'seo-homepage',
        'seo-service',
        'seo-blog',
        'seo-local',
        'seo-gallery',
        'seo-alt',
    ];
}

function load_image_library_dataset(): array {
    ensure_image_storage_directories();
    $path = get_image_library_storage_path();

    if (!is_file($path)) {
        $seed = [
            'tags' => get_default_image_library_tags(),
            'images' => [],
        ];
        file_put_contents($path, json_encode($seed, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));

        return $seed;
    }

    $decoded = json_decode((string) file_get_contents($path), true);
    if (!is_array($decoded)) {
        $decoded = [];
    }

    $tags = isset($decoded['tags']) && is_array($decoded['tags']) ? $decoded['tags'] : [];
    $images = isset($decoded['images']) && is_array($decoded['images']) ? $decoded['images'] : [];

    return [
        'tags' => normalize_image_library_tags(array_merge(get_default_image_library_tags(), $tags)),
        'images' => $images,
    ];
}

function save_image_library_dataset(array $dataset): void {
    ensure_image_storage_directories();
    file_put_contents(get_image_library_storage_path(), json_encode($dataset, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
}

function normalize_image_library_tags(array $tags): array {
    $normalized = [];

    foreach ($tags as $tag) {
        $slug = image_library_slugify((string) $tag);
        if ($slug === '') {
            continue;
        }

        $normalized[] = $slug;
    }

    $normalized = array_values(array_unique($normalized));
    sort($normalized);

    return $normalized;
}

function get_image_library_tag_catalog(): array {
    $dataset = load_image_library_dataset();

    return normalize_image_library_tags($dataset['tags'] ?? []);
}

function get_image_library_images(): array {
    $dataset = load_image_library_dataset();
    $images = [];

    foreach ($dataset['images'] as $record) {
        if (!is_array($record) || empty($record['src'])) {
            continue;
        }

        $images[] = normalize_image_library_record($record);
    }

    usort($images, static function (array $left, array $right): int {
        return strcmp((string) ($right['uploaded_at'] ?? ''), (string) ($left['uploaded_at'] ?? ''));
    });

    return $images;
}

function normalize_image_library_record(array $record): array {
    $record['id'] = trim((string) ($record['id'] ?? ''));
    $record['src'] = trim((string) ($record['src'] ?? ''));
    $record['alt'] = trim((string) ($record['alt'] ?? ''));
    $record['original_name'] = trim((string) ($record['original_name'] ?? ''));
    $record['stored_name'] = trim((string) ($record['stored_name'] ?? basename((string) ($record['src'] ?? ''))));
    $record['thumb_src'] = trim((string) ($record['thumb_src'] ?? ($record['src'] ?? '')));
    $record['thumb_stored_name'] = trim((string) ($record['thumb_stored_name'] ?? basename((string) ($record['thumb_src'] ?? ''))));
    $record['file_name_override'] = trim((string) ($record['file_name_override'] ?? ''));
    $record['mime_type'] = trim((string) ($record['mime_type'] ?? ''));
    $record['extension'] = trim((string) ($record['extension'] ?? pathinfo((string) ($record['stored_name'] ?? $record['src'] ?? ''), PATHINFO_EXTENSION)));
    $record['source'] = trim((string) ($record['source'] ?? 'library'));
    $record['status'] = trim((string) ($record['status'] ?? 'ready'));
    $record['size_bytes'] = (int) ($record['size_bytes'] ?? 0);
    $record['width'] = (int) ($record['width'] ?? 0);
    $record['height'] = (int) ($record['height'] ?? 0);
    $record['thumb_width'] = (int) ($record['thumb_width'] ?? 125);
    $record['thumb_height'] = (int) ($record['thumb_height'] ?? 125);
    $record['thumb_size_bytes'] = (int) ($record['thumb_size_bytes'] ?? 0);
    $record['visible_on_page'] = trim((string) ($record['visible_on_page'] ?? ''));
    $record['uploaded_at'] = trim((string) ($record['uploaded_at'] ?? ''));
    $record['tags'] = normalize_image_library_tags(is_array($record['tags'] ?? null) ? $record['tags'] : []);

    return $record;
}

function add_image_library_record(array $record): array {
    $dataset = load_image_library_dataset();
    $record['id'] = trim((string) ($record['id'] ?? '')) !== '' ? (string) $record['id'] : bin2hex(random_bytes(8));
    $record['uploaded_at'] = trim((string) ($record['uploaded_at'] ?? '')) !== '' ? (string) $record['uploaded_at'] : date('Y-m-d H:i:s');
    $record = normalize_image_library_record($record);

    if ($record['src'] === '') {
        throw new InvalidArgumentException('Image src is required.');
    }

    $dataset['images'][] = $record;
    $dataset['tags'] = normalize_image_library_tags(array_merge($dataset['tags'] ?? [], $record['tags']));
    save_image_library_dataset($dataset);

    return $record;
}

function get_image_library_image_by_id(string $id): ?array {
    foreach (get_image_library_images() as $record) {
        if ((string) ($record['id'] ?? '') === $id) {
            return $record;
        }
    }

    return null;
}

function update_image_library_record(array $input): array {
    $dataset = load_image_library_dataset();
    $records = isset($dataset['images']) && is_array($dataset['images']) ? $dataset['images'] : [];
    $id = trim((string) ($input['id'] ?? ''));

    if ($id === '') {
        throw new InvalidArgumentException('Image id is required.');
    }

    foreach ($records as $index => $record) {
        if ((string) ($record['id'] ?? '') !== $id) {
            continue;
        }

        $updated = normalize_image_library_record(array_merge($record, [
            'alt' => trim((string) ($input['alt'] ?? ($record['alt'] ?? ''))),
            'visible_on_page' => trim((string) ($input['visible_on_page'] ?? ($record['visible_on_page'] ?? ''))),
            'tags' => parse_image_library_tags($input['selected_tags'] ?? [], (string) ($input['custom_tags'] ?? '')),
        ]));

        $records[$index] = $updated;
        $dataset['images'] = $records;
        $dataset['tags'] = normalize_image_library_tags(array_merge($dataset['tags'] ?? [], $updated['tags']));
        save_image_library_dataset($dataset);

        return $updated;
    }

    throw new InvalidArgumentException('Image record not found.');
}
function parse_image_library_tags($selectedTags, string $customTags): array {
    $tags = [];

    if (is_array($selectedTags)) {
        $tags = array_merge($tags, $selectedTags);
    }

    foreach (preg_split('/\s*,\s*/', trim($customTags)) ?: [] as $tag) {
        if ($tag === '') {
            continue;
        }

        $tags[] = $tag;
    }

    return normalize_image_library_tags($tags);
}
