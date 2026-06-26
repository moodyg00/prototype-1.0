<?php

require_once __DIR__ . '/../../services/service-catalog.php';
require_once __DIR__ . '/../../services/service-gallery.php';

function get_ad_group_catalog(): array {
    $groups = [
        'index' => [
            'key' => 'index',
            'label' => 'Index Ads',
            'page_label' => 'Homepage',
            'page_href' => 'index.php',
        ],
    ];

    foreach (get_service_catalog() as $serviceKey => $serviceEntry) {
        $groups[$serviceKey] = [
            'key' => $serviceKey,
            'label' => $serviceEntry['label'] . ' Ads',
            'page_label' => $serviceEntry['label'],
            'page_href' => $serviceEntry['href'],
        ];
    }

    return $groups;
}

function build_seed_default_ad_record(string $groupKey, array $groupMeta): array {
    $serviceImages = $groupKey === 'index'
        ? [['src' => '/images/general_use-20.jpg', 'alt' => 'Homepage ad creative']]
        : get_service_gallery_images($groupKey);

    $leadImage = $serviceImages[0] ?? ['src' => '/images/general_use-24.jpg', 'alt' => $groupMeta['page_label'] . ' ad creative'];

    $defaultProblem = $groupKey === 'index'
        ? 'The repair list keeps getting pushed back'
        : 'Waiting on quotes slows this job down';

    return [
        'id' => $groupKey . '-default',
        'group_key' => $groupKey,
        'internal_name' => $groupMeta['page_label'] . ' Default',
        'url_key' => $groupKey . '-default',
        'status' => 'active',
        'is_default' => true,
        'headline' => $groupKey === 'index' ? 'Send photos. Get a quote fast.' : $groupMeta['page_label'] . '. Fast quote by text.',
        'problem' => $defaultProblem,
        'solution' => 'Text photos and details for a faster SMS + Grok AI quote',
        'offer' => '20% OFF for new customers',
        'cta_label' => 'Text Now for Instant Quote',
        'cta_href' => '',
        'image_src' => $leadImage['src'],
        'image_alt' => $leadImage['alt'],
        'created_at' => '2026-04-24 00:00:00',
        'updated_at' => '2026-04-24 00:00:00',
    ];
}

function get_seed_ads_dataset(): array {
    $groups = get_ad_group_catalog();
    $ads = [];

    foreach ($groups as $groupKey => $groupMeta) {
        $ads[] = build_seed_default_ad_record($groupKey, $groupMeta);
    }

    $ads[] = [
        'id' => 'index-spring-refresh',
        'group_key' => 'index',
        'internal_name' => 'Spring Refresh',
        'url_key' => 'index-spring-refresh',
        'status' => 'active',
        'is_default' => false,
        'headline' => 'Start the project this week.',
        'problem' => 'Small jobs keep slipping down the list',
        'solution' => 'Text photos and details for a faster SMS + Grok AI quote',
        'offer' => '20% OFF for new customers',
        'cta_label' => 'Text Now for Instant Quote',
        'cta_href' => '',
        'image_src' => '/images/general_use-24.jpg',
        'image_alt' => 'Home repair ad creative',
        'created_at' => '2026-04-24 00:00:00',
        'updated_at' => '2026-04-24 00:00:00',
    ];

    $ads[] = [
        'id' => 'pressure-washing-curb-appeal',
        'group_key' => 'pressure-washing',
        'internal_name' => 'Curb Appeal Push',
        'url_key' => 'pressure-washing-curb-appeal',
        'status' => 'draft',
        'is_default' => false,
        'headline' => 'Make the exterior look new.',
        'problem' => 'Dirty exteriors drag the whole house down',
        'solution' => 'Text photos and details for a faster SMS + Grok AI quote',
        'offer' => '20% OFF for new customers',
        'cta_label' => 'Text Now for Instant Quote',
        'cta_href' => '',
        'image_src' => '/images/pressure-washing-2.jpg',
        'image_alt' => 'Pressure washing ad creative',
        'created_at' => '2026-04-24 00:00:00',
        'updated_at' => '2026-04-24 00:00:00',
    ];

    $ads[] = [
        'id' => 'tv-mounting-game-day',
        'group_key' => 'tv-mounting',
        'internal_name' => 'Game Day Mount Ready',
        'url_key' => 'tv-mounting-game-day',
        'status' => 'paused',
        'is_default' => false,
        'headline' => 'Mount it clean before the weekend.',
        'problem' => 'The TV is still sitting on a stand',
        'solution' => 'Text photos and details for a faster SMS + Grok AI quote',
        'offer' => '20% OFF for new customers',
        'cta_label' => 'Text Now for Instant Quote',
        'cta_href' => '',
        'image_src' => '/images/tv-mounting.jpg',
        'image_alt' => 'TV mounting ad creative',
        'created_at' => '2026-04-24 00:00:00',
        'updated_at' => '2026-04-24 00:00:00',
    ];

    return ['ads' => $ads];
}

function build_blank_ad_record(string $groupKey): array {
    $groups = get_ad_group_catalog();
    $groupMeta = $groups[$groupKey] ?? $groups['index'];
    $seedDefault = build_seed_default_ad_record($groupKey, $groupMeta);

    return [
        'id' => '',
        'group_key' => $groupKey,
        'internal_name' => '',
        'url_key' => ads_slugify($groupKey . '-campaign'),
        'status' => 'draft',
        'is_default' => false,
        'headline' => $seedDefault['headline'],
        'problem' => $seedDefault['problem'],
        'solution' => $seedDefault['solution'],
        'offer' => $seedDefault['offer'],
        'cta_label' => $seedDefault['cta_label'],
        'cta_href' => '',
        'image_src' => $seedDefault['image_src'],
        'image_alt' => $seedDefault['image_alt'],
        'created_at' => '',
        'updated_at' => '',
    ];
}

function build_preview_ad_href(array $record): string {
    $groups = get_ad_group_catalog();
    $groupKey = (string) ($record['group_key'] ?? 'index');
    $group = $groups[$groupKey] ?? $groups['index'];
    $urlKey = (string) ($record['url_key'] ?? '');

    if ($urlKey === '') {
        return $group['page_href'];
    }

    return $group['page_href'] . '?ad=' . rawurlencode($urlKey);
}