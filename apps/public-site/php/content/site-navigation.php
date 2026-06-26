<?php

require_once __DIR__ . '/../services/service-catalog.php';

function get_service_navigation_links(): array {
    return array_values(get_service_catalog());
}

function get_site_navigation_links(): array {
    return [
        ['href' => 'index.php', 'label' => 'Home'],
        ['href' => 'pressure-washing.php#estimate-modal', 'label' => 'Request Quote'],
        [
            'label' => 'Services',
            'children' => get_service_navigation_links(),
        ],
        ['href' => 'blog.php', 'label' => 'Blog'],
        ['href' => 'about.php', 'label' => 'About'],
        ['href' => 'area.php', 'label' => 'Area We Serve'],
        ['href' => 'reviews.php', 'label' => 'Reviews'],
    ];
}