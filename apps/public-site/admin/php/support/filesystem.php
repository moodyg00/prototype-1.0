<?php

function normalize_upload_path(string $path): string {
    $normalized = str_replace('\\', '/', trim($path));
    if ($normalized === '') {
        return '';
    }

    return '/' . ltrim($normalized, '/');
}

function ensure_directory(string $directory): bool {
    if (is_dir($directory)) {
        return true;
    }

    return mkdir($directory, 0775, true);
}
