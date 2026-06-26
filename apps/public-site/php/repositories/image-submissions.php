<?php

require_once __DIR__ . '/../services/image-storage.php';
require_once __DIR__ . '/../repositories/image-library.php';

function get_image_submission_storage_path(): string {
    return get_image_submission_dataset_path();
}

function load_image_submission_dataset(): array {
    ensure_image_storage_directories();
    $path = get_image_submission_storage_path();
    if (!is_file($path)) {
        $seed = ['submissions' => []];
        file_put_contents($path, json_encode($seed, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
        return $seed;
    }

    $decoded = json_decode((string) file_get_contents($path), true);
    if (!is_array($decoded)) {
        $decoded = [];
    }

    return [
        'submissions' => isset($decoded['submissions']) && is_array($decoded['submissions']) ? $decoded['submissions'] : [],
    ];
}

function save_image_submission_dataset(array $dataset): void {
    ensure_image_storage_directories();
    file_put_contents(get_image_submission_storage_path(), json_encode($dataset, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
}

function normalize_image_submission_record(array $record): array {
    return [
        'id' => trim((string) ($record['id'] ?? '')),
        'name' => trim((string) ($record['name'] ?? '')),
        'email' => trim((string) ($record['email'] ?? '')),
        'phone' => trim((string) ($record['phone'] ?? '')),
        'notes' => trim((string) ($record['notes'] ?? '')),
        'alt' => trim((string) ($record['alt'] ?? '')),
        'tags' => normalize_image_library_tags(is_array($record['tags'] ?? null) ? $record['tags'] : []),
        'stored_name' => trim((string) ($record['stored_name'] ?? '')),
        'src' => trim((string) ($record['src'] ?? '')),
        'thumb_src' => trim((string) ($record['thumb_src'] ?? '')),
        'mime_type' => trim((string) ($record['mime_type'] ?? '')),
        'extension' => trim((string) ($record['extension'] ?? '')),
        'size_bytes' => (int) ($record['size_bytes'] ?? 0),
        'thumb_width' => (int) ($record['thumb_width'] ?? 125),
        'thumb_height' => (int) ($record['thumb_height'] ?? 125),
        'status' => trim((string) ($record['status'] ?? 'pending')),
        'submitted_at' => trim((string) ($record['submitted_at'] ?? '')),
    ];
}

function get_image_submissions(array $statuses = []): array {
    $dataset = load_image_submission_dataset();
    $records = array_map('normalize_image_submission_record', $dataset['submissions'] ?? []);
    if ($statuses !== []) {
        $records = array_values(array_filter($records, static function (array $record) use ($statuses): bool {
            return in_array((string) ($record['status'] ?? ''), $statuses, true);
        }));
    }

    usort($records, static function (array $left, array $right): int {
        return strcmp((string) ($right['submitted_at'] ?? ''), (string) ($left['submitted_at'] ?? ''));
    });

    return $records;
}

function get_image_submission_by_id(string $submissionId): ?array {
    foreach (get_image_submissions() as $record) {
        if ((string) ($record['id'] ?? '') === $submissionId) {
            return $record;
        }
    }

    return null;
}

function add_image_submission_record(array $record): array {
    $dataset = load_image_submission_dataset();
    $normalized = normalize_image_submission_record(array_merge($record, [
        'id' => trim((string) ($record['id'] ?? '')) !== '' ? (string) $record['id'] : bin2hex(random_bytes(8)),
        'submitted_at' => trim((string) ($record['submitted_at'] ?? '')) !== '' ? (string) $record['submitted_at'] : date('Y-m-d H:i:s'),
        'status' => trim((string) ($record['status'] ?? 'pending')) !== '' ? (string) $record['status'] : 'pending',
    ]));
    $dataset['submissions'][] = $normalized;
    save_image_submission_dataset($dataset);
    return $normalized;
}

function update_image_submission_status(string $submissionId, string $status): array {
    $dataset = load_image_submission_dataset();
    foreach ($dataset['submissions'] as $index => $record) {
        if ((string) ($record['id'] ?? '') !== $submissionId) {
            continue;
        }

        $dataset['submissions'][$index]['status'] = $status;
        save_image_submission_dataset($dataset);
        return normalize_image_submission_record($dataset['submissions'][$index]);
    }

    throw new InvalidArgumentException('Submission record not found.');
}