<?php

require_once __DIR__ . '/../../../php/repositories/ads.php';

function build_ads_admin_return_url(string $groupKey, string $adId, bool $isCreating, array $extra = []): string {
    $params = array_merge(['group' => $groupKey], $extra);

    if ($adId !== '') {
        $params['id'] = $adId;
    } elseif ($isCreating) {
        $params['new'] = '1';
    }

    return 'ads.php?' . http_build_query($params);
}

function build_ads_notice_message(?string $notice): ?string {
    $noticeMessages = [
        'saved' => 'Ad saved.',
        'created' => 'Ad created.',
        'deleted' => 'Ad deleted.',
        'uploaded' => 'Image uploaded. Choose it from the library or keep the prefilled selection.',
    ];

    return $noticeMessages[(string) $notice] ?? null;
}

function build_posted_ad_record(string $groupKey, array $post): array {
    return array_merge(
        build_blank_ad_record($groupKey),
        [
            'id' => trim((string) ($post['id'] ?? '')),
            'group_key' => $groupKey,
            'internal_name' => trim((string) ($post['internal_name'] ?? '')),
            'url_key' => ads_slugify((string) ($post['url_key'] ?? '')),
            'status' => trim((string) ($post['status'] ?? 'draft')),
            'headline' => trim((string) ($post['headline'] ?? '')),
            'problem' => trim((string) ($post['problem'] ?? '')),
            'solution' => trim((string) ($post['solution'] ?? '')),
            'offer' => trim((string) ($post['offer'] ?? '')),
            'cta_label' => trim((string) ($post['cta_label'] ?? '')),
            'cta_href' => trim((string) ($post['cta_href'] ?? '')),
            'image_src' => trim((string) ($post['image_src'] ?? '')),
            'image_alt' => trim((string) ($post['image_alt'] ?? '')),
        ]
    );
}

function resolve_selected_ad_record(string $selectedGroupKey, string $selectedAdId, bool $isCreating, ?string $error, array $post): array {
    if ($error !== null && !empty($post)) {
        return build_posted_ad_record($selectedGroupKey, $post);
    }

    if ($isCreating) {
        return build_blank_ad_record($selectedGroupKey);
    }

    if ($selectedAdId !== '') {
        return get_ad_record_by_id($selectedAdId) ?? get_default_ad_record($selectedGroupKey) ?? build_blank_ad_record($selectedGroupKey);
    }

    return get_default_ad_record($selectedGroupKey) ?? build_blank_ad_record($selectedGroupKey);
}

function count_ads_summary(array $adsByGroup): array {
    $totalAds = 0;
    $activeAds = 0;

    foreach ($adsByGroup as $groupData) {
        foreach ($groupData['ads'] as $record) {
            $totalAds++;
            if ((string) ($record['status'] ?? '') === 'active') {
                $activeAds++;
            }
        }
    }

    return [
        'totalAds' => $totalAds,
        'activeAds' => $activeAds,
    ];
}