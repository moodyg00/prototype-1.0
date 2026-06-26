<?php

function get_shared_media_url(string $path = ''): string {
    $normalized = ltrim(str_replace('\\', '/', trim($path)), '/');

    if ($normalized === '') {
        return '/media/shared';
    }

    return '/media/shared/' . $normalized;
}

function get_shared_media_path(string $path = ''): string {
    $normalized = ltrim(str_replace('\\', '/', trim($path)), '/');
    $basePath = __DIR__ . '/../../media/shared';

    if ($normalized === '') {
        return $basePath;
    }

    return $basePath . '/' . $normalized;
}

function get_private_media_path(string $path = ''): string {
    $normalized = ltrim(str_replace('\\', '/', trim($path)), '/');
    $basePath = __DIR__ . '/../../storage/private/media';

    if ($normalized === '') {
        return $basePath;
    }

    return $basePath . '/' . $normalized;
}
