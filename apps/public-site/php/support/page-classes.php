<?php

function sanitize_page_class_fragment(string $value): string {
    $normalized = strtolower(trim($value));
    $normalized = preg_replace('/[^a-z0-9]+/', '-', $normalized) ?? '';
    return trim($normalized, '-');
}

function build_page_class_string(array $classes): string {
    $normalizedClasses = [];

    foreach ($classes as $className) {
        if (!is_string($className)) {
            continue;
        }

        foreach (preg_split('/\s+/', trim($className)) ?: [] as $part) {
            $sanitized = sanitize_page_class_fragment($part);
            if ($sanitized !== '') {
                $normalizedClasses[$sanitized] = true;
            }
        }
    }

    return implode(' ', array_keys($normalizedClasses));
}

function get_public_page_class_string(?string $serviceType = null, ?string $extraClasses = null): string {
    $scriptName = pathinfo($_SERVER['SCRIPT_NAME'] ?? 'index.php', PATHINFO_FILENAME);
    $pageSlug = sanitize_page_class_fragment($scriptName === '' ? 'index' : $scriptName);
    $classes = ['site-page', 'page-' . $pageSlug];

    if ($pageSlug === 'index') {
        $classes[] = 'page-home';
    }

    if (is_string($serviceType) && trim($serviceType) !== '') {
        $serviceSlug = sanitize_page_class_fragment($serviceType);
        if ($serviceSlug !== '') {
            $classes[] = 'page-service';
            $classes[] = 'page-service-' . $serviceSlug;
        }
    }

    if ($extraClasses !== null) {
        $classes[] = $extraClasses;
    }

    return build_page_class_string($classes);
}

function get_admin_page_class_string(?string $extraClasses = null): string {
    $scriptName = pathinfo($_SERVER['SCRIPT_NAME'] ?? 'index.php', PATHINFO_FILENAME);
    $pageSlug = sanitize_page_class_fragment($scriptName === '' ? 'index' : $scriptName);
    $classes = ['admin-page', 'page-admin', 'page-admin-' . $pageSlug];

    if ($extraClasses !== null) {
        $classes[] = $extraClasses;
    }

    return build_page_class_string($classes);
}
