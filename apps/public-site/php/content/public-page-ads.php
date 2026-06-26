<?php

require_once __DIR__ . '/../services/service-catalog.php';
require_once __DIR__ . '/../services/service-gallery.php';
require_once __DIR__ . '/../repositories/ads.php';
require_once __DIR__ . '/../support/contact.php';

function get_public_requested_ad_key(): ?string {
    $adKey = trim((string) ($_GET['ad'] ?? ''));

    return $adKey !== '' ? $adKey : null;
}

function build_service_fallback_ad(string $serviceType, string $requestedAdKey): array {
    $serviceCatalogEntry = get_service_catalog_entry($serviceType) ?? [];
    $serviceLabel = $serviceCatalogEntry['label'] ?? ucwords(str_replace('-', ' ', $serviceType));
    $serviceDescription = $serviceCatalogEntry['description'] ?? ('Professional ' . strtolower($serviceLabel) . ' help in Austin and surrounding areas.');
    $serviceImages = get_service_gallery_images($serviceType);
    $leadImage = $serviceImages[0] ?? ['src' => '/images/general_use-24.jpg', 'alt' => $serviceLabel . ' service ad'];

    return [
        'requested_key' => $requestedAdKey,
        'headline' => $serviceLabel . '. Fast quote by text.',
        'image' => $leadImage,
        'problem' => 'Getting a quote should not take this much effort',
        'solution' => 'Text photos and details for a faster SMS + Grok AI quote',
        'offer' => '20% OFF for new customers',
        'cta_label' => 'Text Now for Instant Quote',
        'cta_href' => get_public_sms_href(),
    ];
}

function get_public_ad_group_key(?string $serviceType = null): string {
    if (is_string($serviceType) && trim($serviceType) !== '') {
        return $serviceType;
    }

    $pageSlug = pathinfo($_SERVER['SCRIPT_NAME'] ?? 'index.php', PATHINFO_FILENAME);

    return $pageSlug === 'index' ? 'index' : 'index';
}

function build_public_page_ad_payload_from_record(array $record): array {
    return [
        'requested_key' => (string) ($record['url_key'] ?? ''),
        'headline' => (string) ($record['headline'] ?? ''),
        'image' => [
            'src' => (string) (($record['image_src'] ?? '') !== '' ? $record['image_src'] : '/images/general_use-24.jpg'),
            'alt' => (string) (($record['image_alt'] ?? '') !== '' ? $record['image_alt'] : 'Advertisement creative'),
        ],
        'problem' => (string) ($record['problem'] ?? ''),
        'solution' => (string) ($record['solution'] ?? ''),
        'offer' => (string) ($record['offer'] ?? ''),
        'cta_label' => (string) (($record['cta_label'] ?? '') !== '' ? $record['cta_label'] : 'Text Now for Instant Quote'),
        'cta_href' => (string) (($record['cta_href'] ?? '') !== '' ? $record['cta_href'] : get_public_sms_href()),
    ];
}

function get_public_page_ad_content(?string $serviceType = null): ?array {
    $requestedAdKey = get_public_requested_ad_key();

    if ($requestedAdKey === null) {
        return null;
    }

    $adGroupKey = get_public_ad_group_key($serviceType);
    $storedAd = find_public_ad_record($adGroupKey, $requestedAdKey);

    if ($storedAd !== null) {
        return build_public_page_ad_payload_from_record($storedAd);
    }

    if (is_string($serviceType) && trim($serviceType) !== '') {
        return build_service_fallback_ad($serviceType, $requestedAdKey);
    }

    $pageSlug = pathinfo($_SERVER['SCRIPT_NAME'] ?? 'index.php', PATHINFO_FILENAME);

    $fallbackAds = [
        'index' => [
            'requested_key' => $requestedAdKey,
            'headline' => 'Send photos. Get a quote fast.',
            'image' => ['src' => '/images/general_use-20.jpg', 'alt' => 'Contractor cutting lumber on a job site'],
            'problem' => 'The repair list keeps getting pushed back',
            'solution' => 'Text photos and details for a faster SMS + Grok AI quote',
            'offer' => '20% OFF for new customers',
            'cta_label' => 'Text Now for Instant Quote',
            'cta_href' => get_public_sms_href(),
        ],
    ];

    return $fallbackAds[$pageSlug] ?? [
        'requested_key' => $requestedAdKey,
        'headline' => 'Fast help starts by text.',
        'image' => ['src' => '/images/general_use-24.jpg', 'alt' => 'General home service project'],
        'problem' => 'Waiting on quotes slows the job down',
        'solution' => 'Text photos and details for a faster SMS + Grok AI quote',
        'offer' => '20% OFF for new customers',
        'cta_label' => 'Text Now for Instant Quote',
        'cta_href' => get_public_sms_href(),
    ];
}