<?php

function get_static_site_image_directory(): string {
    return __DIR__ . '/../../images';
}

function get_static_site_image_public_directory(): string {
    return '/images';
}

function get_image_library_dataset_path(): string {
    return __DIR__ . '/../../data/image-library.json';
}

function get_image_submission_dataset_path(): string {
    return __DIR__ . '/../../data/image-submissions.json';
}

function get_image_library_root_directory(): string {
    return __DIR__ . '/../../uploads/image-library';
}

function get_image_library_public_root_directory(): string {
    return '/uploads/image-library';
}

function build_image_library_date_segment(?int $timestamp = null): string {
    return date('Ymd', $timestamp ?? time());
}

function get_image_library_upload_directory(string $dateSegment = ''): string {
    $dateSegment = trim($dateSegment);
    if ($dateSegment === '') {
        return get_image_library_root_directory();
    }

    return get_image_library_root_directory() . '/' . $dateSegment;
}

function get_image_library_public_directory(string $dateSegment = ''): string {
    $dateSegment = trim($dateSegment);
    if ($dateSegment === '') {
        return get_image_library_public_root_directory();
    }

    return get_image_library_public_root_directory() . '/' . $dateSegment;
}

function get_image_library_thumbnail_directory(string $dateSegment = ''): string {
    $baseDirectory = get_image_library_upload_directory($dateSegment);
    return $baseDirectory . '/thumbs';
}

function get_image_library_thumbnail_public_directory(string $dateSegment = ''): string {
    return get_image_library_public_directory($dateSegment) . '/thumbs';
}

function get_submitted_image_directory(): string {
    return __DIR__ . '/../../uploads/submitted-images';
}

function get_submitted_image_public_directory(): string {
    return '/uploads/submitted-images';
}

function get_submitted_image_thumbnail_directory(): string {
    return get_submitted_image_directory() . '/thumbs';
}

function get_submitted_image_thumbnail_public_directory(): string {
    return get_submitted_image_public_directory() . '/thumbs';
}

function ensure_image_storage_directories(): void {
    $directories = [
        dirname(get_image_library_dataset_path()),
        dirname(get_image_submission_dataset_path()),
        get_image_library_root_directory(),
        get_submitted_image_directory(),
        get_submitted_image_thumbnail_directory(),
    ];

    foreach ($directories as $directory) {
        if (!is_dir($directory)) {
            mkdir($directory, 0775, true);
        }
    }
}