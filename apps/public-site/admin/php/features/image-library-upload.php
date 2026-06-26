<?php

require_once __DIR__ . '/../../../php/repositories/image-library.php';
require_once __DIR__ . '/../../../php/repositories/image-submissions.php';
require_once __DIR__ . '/../../../php/services/image-processing.php';

function get_uploaded_image_dimensions(string $filePath): array {
    $dimensions = @getimagesize($filePath);
    if (!is_array($dimensions)) {
        return ['width' => 0, 'height' => 0];
    }

    return [
        'width' => (int) ($dimensions[0] ?? 0),
        'height' => (int) ($dimensions[1] ?? 0),
    ];
}

function validate_image_library_upload_file(array $file): array {
    if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
        throw new InvalidArgumentException('Choose an image file to upload.');
    }

    $tmpPath = (string) ($file['tmp_name'] ?? '');
    if ($tmpPath === '' || !is_uploaded_file($tmpPath)) {
        throw new InvalidArgumentException('The upload could not be verified.');
    }

    $size = (int) ($file['size'] ?? 0);
    if ($size <= 0 || $size > 8 * 1024 * 1024) {
        throw new InvalidArgumentException('Images must be smaller than 8MB.');
    }

    $fileInfo = new finfo(FILEINFO_MIME_TYPE);
    $mimeType = (string) $fileInfo->file($tmpPath);
    $allowedTypes = [
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp',
        'image/gif' => 'gif',
    ];

    if (!isset($allowedTypes[$mimeType])) {
        throw new InvalidArgumentException('Use JPG, PNG, WEBP, or GIF images.');
    }

    return [
        'mime_type' => $mimeType,
        'extension' => $allowedTypes[$mimeType],
        'tmp_path' => $tmpPath,
    ];
}

function build_uploaded_image_alt_text(string $originalName): string {
    $baseName = pathinfo($originalName, PATHINFO_FILENAME);
    $baseName = str_replace(['-', '_'], ' ', $baseName);
    $baseName = trim(preg_replace('/\s+/', ' ', $baseName) ?? '');

    return $baseName !== '' ? ucfirst($baseName) : 'Uploaded ad image';
}

function build_uploaded_image_file_slug(string $override, string $originalName): string {
    $source = trim($override);
    $slug = image_library_slugify($source);

    return $slug !== '' ? $slug : 'image';
}

function normalize_uploaded_image_file_list(array $files): array {
    if (!isset($files['name']) || !is_array($files['name'])) {
        return [$files];
    }

    $normalized = [];
    foreach ($files['name'] as $index => $name) {
        $normalized[] = [
            'name' => $name,
            'type' => $files['type'][$index] ?? null,
            'tmp_name' => $files['tmp_name'][$index] ?? null,
            'error' => $files['error'][$index] ?? UPLOAD_ERR_NO_FILE,
            'size' => $files['size'][$index] ?? 0,
        ];
    }

    return $normalized;
}

function store_uploaded_image_library_image(array $file, array $input = []): array {
    $originalName = basename((string) ($file['name'] ?? 'image'));
    $fileNameOverride = trim((string) ($input['file_name_override'] ?? ''));
    $baseSlug = build_uploaded_image_file_slug($fileNameOverride, $originalName);
    $validatedFile = validate_image_library_upload_file($file);
    $processed = process_admin_image_upload($validatedFile['tmp_path'], $validatedFile['mime_type'], $baseSlug);

    $altText = trim((string) ($input['image_alt'] ?? ''));
    if ($altText === '') {
        $altText = build_uploaded_image_alt_text($originalName);
    }

    return add_image_library_record([
        'id' => bin2hex(random_bytes(8)),
        'src' => (string) ($processed['src'] ?? ''),
        'alt' => $altText,
        'tags' => parse_image_library_tags($input['selected_tags'] ?? [], (string) ($input['custom_tags'] ?? '')),
        'original_name' => '',
        'stored_name' => (string) ($processed['stored_name'] ?? ''),
        'thumb_src' => (string) ($processed['thumb_src'] ?? ''),
        'thumb_stored_name' => (string) ($processed['thumb_stored_name'] ?? ''),
        'file_name_override' => $fileNameOverride,
        'mime_type' => (string) ($processed['mime_type'] ?? 'image/webp'),
        'extension' => (string) ($processed['extension'] ?? 'webp'),
        'source' => 'admin-library-upload',
        'status' => 'ready',
        'size_bytes' => (int) ($processed['size_bytes'] ?? 0),
        'width' => (int) ($processed['width'] ?? 0),
        'height' => (int) ($processed['height'] ?? 0),
        'thumb_width' => (int) ($processed['thumb_width'] ?? 125),
        'thumb_height' => (int) ($processed['thumb_height'] ?? 125),
        'thumb_size_bytes' => (int) ($processed['thumb_size_bytes'] ?? 0),
        'uploaded_at' => date('Y-m-d H:i:s'),
    ]);
}

function store_uploaded_image_library_images(array $files, array $input = []): array {
    $records = [];
    $normalizedFiles = normalize_uploaded_image_file_list($files);
    foreach ($normalizedFiles as $index => $file) {
        if (($file['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE) {
            continue;
        }

        $recordInput = $input;
        if (count($normalizedFiles) > 1) {
            $recordInput['image_alt'] = '';
        }

        $records[] = store_uploaded_image_library_image($file, $recordInput);
    }

    if ($records === []) {
        throw new InvalidArgumentException('Choose at least one image file to upload.');
    }

    return $records;
}

function store_public_image_submission(array $file, array $input = []): array {
    $validatedFile = validate_image_library_upload_file($file);
    $destinationName = build_processed_image_name('userupload', $validatedFile['extension']);
    $destinationPath = get_submitted_image_directory() . '/' . $destinationName;

    if (!move_uploaded_file($validatedFile['tmp_path'], $destinationPath)) {
        throw new RuntimeException('The submitted image could not be saved.');
    }

    $thumbnail = create_submitted_image_thumbnail($destinationPath, $validatedFile['mime_type'], pathinfo($destinationName, PATHINFO_FILENAME));

    return add_image_submission_record([
        'name' => trim((string) ($input['name'] ?? '')),
        'email' => trim((string) ($input['email'] ?? '')),
        'phone' => trim((string) ($input['phone'] ?? '')),
        'notes' => trim((string) ($input['notes'] ?? '')),
        'alt' => trim((string) ($input['alt'] ?? '')),
        'tags' => parse_image_library_tags($input['selected_tags'] ?? [], (string) ($input['custom_tags'] ?? '')),
        'stored_name' => $destinationName,
        'src' => get_submitted_image_public_directory() . '/' . $destinationName,
        'thumb_src' => (string) ($thumbnail['thumb_src'] ?? ''),
        'mime_type' => $validatedFile['mime_type'],
        'extension' => $validatedFile['extension'],
        'size_bytes' => (int) filesize($destinationPath),
        'thumb_width' => (int) ($thumbnail['thumb_width'] ?? 125),
        'thumb_height' => (int) ($thumbnail['thumb_height'] ?? 125),
        'status' => 'pending',
    ]);
}

function approve_image_submission_to_library(string $submissionId, array $input = []): array {
    $submission = get_image_submission_by_id($submissionId);
    if ($submission === null) {
        throw new InvalidArgumentException('Submission record not found.');
    }

    if (($submission['status'] ?? '') !== 'pending') {
        throw new InvalidArgumentException('Only pending submissions can be approved.');
    }

    $sourcePath = resolve_image_public_path_to_filesystem((string) ($submission['src'] ?? ''));
    if ($sourcePath === '' || !is_file($sourcePath)) {
        throw new InvalidArgumentException('The submission file could not be found.');
    }

    $processed = process_admin_image_upload($sourcePath, (string) ($submission['mime_type'] ?? ''), 'userupload');
    $libraryRecord = add_image_library_record([
        'id' => bin2hex(random_bytes(8)),
        'src' => (string) ($processed['src'] ?? ''),
        'alt' => trim((string) ($input['alt'] ?? ($submission['alt'] ?? ''))),
        'tags' => parse_image_library_tags($input['selected_tags'] ?? ($submission['tags'] ?? []), (string) ($input['custom_tags'] ?? '')),
        'original_name' => '',
        'stored_name' => (string) ($processed['stored_name'] ?? ''),
        'thumb_src' => (string) ($processed['thumb_src'] ?? ''),
        'thumb_stored_name' => (string) ($processed['thumb_stored_name'] ?? ''),
        'mime_type' => (string) ($processed['mime_type'] ?? 'image/webp'),
        'extension' => (string) ($processed['extension'] ?? 'webp'),
        'source' => 'frontend-submission',
        'status' => 'ready',
        'size_bytes' => (int) ($processed['size_bytes'] ?? 0),
        'width' => (int) ($processed['width'] ?? 0),
        'height' => (int) ($processed['height'] ?? 0),
        'thumb_width' => (int) ($processed['thumb_width'] ?? 125),
        'thumb_height' => (int) ($processed['thumb_height'] ?? 125),
        'thumb_size_bytes' => (int) ($processed['thumb_size_bytes'] ?? 0),
        'visible_on_page' => trim((string) ($input['visible_on_page'] ?? '')),
    ]);

    @unlink($sourcePath);

    update_image_submission_status($submissionId, 'approved');

    return $libraryRecord;
}