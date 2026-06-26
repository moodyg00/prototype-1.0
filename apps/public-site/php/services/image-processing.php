<?php

require_once __DIR__ . '/image-storage.php';

function build_processed_image_name(string $slug, string $extension, ?int $timestamp = null): string {
    return date('Ymd-His', $timestamp ?? time()) . '-' . bin2hex(random_bytes(4)) . '-' . trim($slug, '-') . '.' . ltrim($extension, '.');
}

function get_supported_image_output_formats(): array {
    return [
        'jpg' => 'JPEG',
        'png' => 'PNG',
        'webp' => 'WEBP',
    ];
}

function get_mime_type_for_image_extension(string $extension): string {
    $extension = strtolower(trim($extension));
    $map = [
        'jpg' => 'image/jpeg',
        'jpeg' => 'image/jpeg',
        'png' => 'image/png',
        'webp' => 'image/webp',
        'gif' => 'image/gif',
    ];

    return $map[$extension] ?? 'application/octet-stream';
}

function resolve_image_public_path_to_filesystem(string $publicPath): string {
    $publicPath = '/' . ltrim(trim($publicPath), '/');
    return dirname(__DIR__, 2) . $publicPath;
}

function create_square_thumbnail_from_resource($source, int $sourceWidth, int $sourceHeight, int $size = 125) {
    $cropSize = min($sourceWidth, $sourceHeight);
    $sourceX = (int) floor(($sourceWidth - $cropSize) / 2);
    $sourceY = (int) floor(($sourceHeight - $cropSize) / 2);

    $thumbnail = imagecreatetruecolor($size, $size);
    imagealphablending($thumbnail, false);
    imagesavealpha($thumbnail, true);
    $transparent = imagecolorallocatealpha($thumbnail, 0, 0, 0, 127);
    imagefilledrectangle($thumbnail, 0, 0, $size, $size, $transparent);
    imagecopyresampled($thumbnail, $source, 0, 0, $sourceX, $sourceY, $size, $size, $cropSize, $cropSize);

    return $thumbnail;
}

function process_admin_image_upload(string $tmpPath, string $mimeType, string $slug, ?int $timestamp = null): array {
    $resource = load_gd_image_resource($tmpPath, $mimeType);
    if (!$resource) {
        throw new RuntimeException('The uploaded image could not be processed.');
    }

    $timestamp = $timestamp ?? time();
    $dateSegment = build_image_library_date_segment($timestamp);
    $targetSize = calculate_transformed_dimensions((int) imagesx($resource), (int) imagesy($resource), 1200, 0);
    $processed = imagecreatetruecolor($targetSize['width'], $targetSize['height']);
    imagealphablending($processed, false);
    imagesavealpha($processed, true);
    $transparent = imagecolorallocatealpha($processed, 0, 0, 0, 127);
    imagefilledrectangle($processed, 0, 0, $targetSize['width'], $targetSize['height'], $transparent);
    imagecopyresampled($processed, $resource, 0, 0, 0, 0, $targetSize['width'], $targetSize['height'], (int) imagesx($resource), (int) imagesy($resource));

    $fileName = build_processed_image_name($slug, 'webp', $timestamp);
    $thumbName = preg_replace('/\.webp$/', '-thumb.webp', $fileName) ?: ($fileName . '-thumb.webp');
    $targetDirectory = get_image_library_upload_directory($dateSegment);
    $thumbDirectory = get_image_library_thumbnail_directory($dateSegment);
    if (!is_dir($targetDirectory)) {
        mkdir($targetDirectory, 0775, true);
    }
    if (!is_dir($thumbDirectory)) {
        mkdir($thumbDirectory, 0775, true);
    }

    $targetPath = $targetDirectory . '/' . $fileName;
    $thumbPath = $thumbDirectory . '/' . $thumbName;
    imagewebp($processed, $targetPath, 82);

    $thumbnail = create_square_thumbnail_from_resource($processed, $targetSize['width'], $targetSize['height'], 125);
    imagewebp($thumbnail, $thumbPath, 82);

    imagedestroy($thumbnail);
    imagedestroy($processed);
    imagedestroy($resource);

    return [
        'src' => get_image_library_public_directory($dateSegment) . '/' . $fileName,
        'stored_name' => $fileName,
        'thumb_src' => get_image_library_thumbnail_public_directory($dateSegment) . '/' . $thumbName,
        'thumb_stored_name' => $thumbName,
        'mime_type' => 'image/webp',
        'extension' => 'webp',
        'size_bytes' => (int) filesize($targetPath),
        'width' => $targetSize['width'],
        'height' => $targetSize['height'],
        'thumb_width' => 125,
        'thumb_height' => 125,
        'thumb_size_bytes' => (int) filesize($thumbPath),
    ];
}

function create_submitted_image_thumbnail(string $sourcePath, string $sourceMimeType, string $baseName): array {
    $resource = load_gd_image_resource($sourcePath, $sourceMimeType);
    if (!$resource) {
        throw new RuntimeException('The submitted image thumbnail could not be generated.');
    }

    $thumbDirectory = get_submitted_image_thumbnail_directory();
    if (!is_dir($thumbDirectory)) {
        mkdir($thumbDirectory, 0775, true);
    }

    $thumbnail = create_square_thumbnail_from_resource($resource, (int) imagesx($resource), (int) imagesy($resource), 125);
    $thumbName = $baseName . '-thumb.webp';
    $thumbPath = $thumbDirectory . '/' . $thumbName;
    imagewebp($thumbnail, $thumbPath, 82);

    imagedestroy($thumbnail);
    imagedestroy($resource);

    return [
        'thumb_src' => get_submitted_image_thumbnail_public_directory() . '/' . $thumbName,
        'thumb_stored_name' => $thumbName,
        'thumb_width' => 125,
        'thumb_height' => 125,
        'thumb_size_bytes' => (int) filesize($thumbPath),
    ];
}

function load_gd_image_resource(string $filePath, string $mimeType) {
    switch ($mimeType) {
        case 'image/jpeg':
            return imagecreatefromjpeg($filePath);
        case 'image/png':
            return imagecreatefrompng($filePath);
        case 'image/webp':
            return imagecreatefromwebp($filePath);
        case 'image/gif':
            return imagecreatefromgif($filePath);
        default:
            throw new InvalidArgumentException('Unsupported source image type.');
    }
}

function save_gd_image_resource($image, string $destinationPath, string $format): void {
    switch ($format) {
        case 'jpg':
            imagejpeg($image, $destinationPath, 86);
            return;
        case 'png':
            imagepng($image, $destinationPath, 6);
            return;
        case 'webp':
            imagewebp($image, $destinationPath, 86);
            return;
        default:
            throw new InvalidArgumentException('Unsupported output image format.');
    }
}

function normalize_image_transform_options(array $input): array {
    $format = strtolower(trim((string) ($input['format'] ?? '')));
    $maxWidth = max(0, (int) ($input['max_width'] ?? 0));
    $maxHeight = max(0, (int) ($input['max_height'] ?? 0));

    if ($format === '' || $format === 'keep') {
        $format = '';
    }

    return [
        'format' => $format,
        'max_width' => $maxWidth,
        'max_height' => $maxHeight,
    ];
}

function calculate_transformed_dimensions(int $sourceWidth, int $sourceHeight, int $maxWidth, int $maxHeight): array {
    if ($sourceWidth <= 0 || $sourceHeight <= 0) {
        return ['width' => 0, 'height' => 0];
    }

    if ($maxWidth <= 0 && $maxHeight <= 0) {
        return ['width' => $sourceWidth, 'height' => $sourceHeight];
    }

    $widthRatio = $maxWidth > 0 ? ($maxWidth / $sourceWidth) : 1;
    $heightRatio = $maxHeight > 0 ? ($maxHeight / $sourceHeight) : 1;
    $ratio = min($widthRatio, $heightRatio, 1);

    return [
        'width' => max(1, (int) round($sourceWidth * $ratio)),
        'height' => max(1, (int) round($sourceHeight * $ratio)),
    ];
}

function save_processed_library_image($resource, int $sourceWidth, int $sourceHeight, string $slug, string $outputFormat, int $maxWidth, int $maxHeight): array {
    $targetSize = calculate_transformed_dimensions($sourceWidth, $sourceHeight, $maxWidth, $maxHeight);
    $target = imagecreatetruecolor($targetSize['width'], $targetSize['height']);
    if (in_array($outputFormat, ['png', 'webp'], true)) {
        imagealphablending($target, false);
        imagesavealpha($target, true);
        $transparent = imagecolorallocatealpha($target, 0, 0, 0, 127);
        imagefilledrectangle($target, 0, 0, $targetSize['width'], $targetSize['height'], $transparent);
    }

    imagecopyresampled($target, $resource, 0, 0, 0, 0, $targetSize['width'], $targetSize['height'], $sourceWidth, $sourceHeight);

    $timestamp = time();
    $dateSegment = build_image_library_date_segment($timestamp);
    $fileName = build_processed_image_name($slug, $outputFormat, $timestamp);
    $thumbName = preg_replace('/\.[^.]+$/', '-thumb.webp', $fileName) ?: ($fileName . '-thumb.webp');
    $targetDirectory = get_image_library_upload_directory($dateSegment);
    $thumbDirectory = get_image_library_thumbnail_directory($dateSegment);
    if (!is_dir($targetDirectory)) {
        mkdir($targetDirectory, 0775, true);
    }
    if (!is_dir($thumbDirectory)) {
        mkdir($thumbDirectory, 0775, true);
    }

    $targetPath = $targetDirectory . '/' . $fileName;
    $thumbPath = $thumbDirectory . '/' . $thumbName;
    save_gd_image_resource($target, $targetPath, $outputFormat);
    $thumbnail = create_square_thumbnail_from_resource($target, $targetSize['width'], $targetSize['height'], 125);
    imagewebp($thumbnail, $thumbPath, 82);

    imagedestroy($thumbnail);
    imagedestroy($target);

    return [
        'src' => get_image_library_public_directory($dateSegment) . '/' . $fileName,
        'stored_name' => $fileName,
        'thumb_src' => get_image_library_thumbnail_public_directory($dateSegment) . '/' . $thumbName,
        'thumb_stored_name' => $thumbName,
        'mime_type' => get_mime_type_for_image_extension($outputFormat),
        'extension' => $outputFormat,
        'width' => $targetSize['width'],
        'height' => $targetSize['height'],
        'size_bytes' => (int) filesize($targetPath),
        'thumb_width' => 125,
        'thumb_height' => 125,
        'thumb_size_bytes' => (int) filesize($thumbPath),
    ];
}

function process_image_library_asset(array $imageRecord, array $options): array {
    $sourcePath = resolve_image_public_path_to_filesystem((string) ($imageRecord['src'] ?? ''));
    if (!is_file($sourcePath)) {
        throw new InvalidArgumentException('The image file could not be found.');
    }

    $normalized = normalize_image_transform_options($options);
    $sourceExtension = strtolower(trim((string) ($imageRecord['extension'] ?? pathinfo($sourcePath, PATHINFO_EXTENSION))));
    $outputFormat = $normalized['format'] !== '' ? $normalized['format'] : ($sourceExtension === 'jpeg' ? 'jpg' : $sourceExtension);

    if (!isset(get_supported_image_output_formats()[$outputFormat])) {
        throw new InvalidArgumentException('Only JPG, PNG, and WEBP output formats are supported right now.');
    }

    $sourceMimeType = trim((string) ($imageRecord['mime_type'] ?? ''));
    $resource = load_gd_image_resource($sourcePath, $sourceMimeType !== '' ? $sourceMimeType : get_mime_type_for_image_extension($sourceExtension));
    if (!$resource) {
        throw new RuntimeException('The image could not be loaded for processing.');
    }

    $sourceWidth = (int) imagesx($resource);
    $sourceHeight = (int) imagesy($resource);
    $processed = save_processed_library_image(
        $resource,
        $sourceWidth,
        $sourceHeight,
        image_library_slugify((string) ($imageRecord['file_name_override'] ?? $imageRecord['alt'] ?? 'image')) ?: 'image',
        $outputFormat,
        $normalized['max_width'] > 0 ? $normalized['max_width'] : $sourceWidth,
        max(0, $normalized['max_height'])
    );

    imagedestroy($resource);
    @unlink($sourcePath);
    $oldThumbPath = resolve_image_public_path_to_filesystem((string) ($imageRecord['thumb_src'] ?? ''));
    if (is_file($oldThumbPath)) {
        @unlink($oldThumbPath);
    }

    return $processed;
}