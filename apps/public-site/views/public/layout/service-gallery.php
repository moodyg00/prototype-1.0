<?php

require_once __DIR__ . '/../../../php/services/service-gallery.php';

$serviceGalleryState = $GLOBALS['serviceGalleryState'] ?? [];

if (!isset($serviceGalleryState[$service_type])) {
    $serviceGalleryState[$service_type] = [
        'images' => get_service_gallery_images((string) $service_type),
        'index' => 0,
    ];
}

$serviceGalleryImages = $serviceGalleryState[$service_type]['images'];
$serviceGalleryIndex = $serviceGalleryState[$service_type]['index'];
$serviceGalleryImage = $serviceGalleryImages[$serviceGalleryIndex] ?? null;
$serviceGalleryState[$service_type]['index'] = $serviceGalleryIndex + 1;
$GLOBALS['serviceGalleryState'] = $serviceGalleryState;

if (!$serviceGalleryImage) {
    return;
}
?>
<img
    class="service-image"
    src="<?php echo htmlspecialchars((string) $serviceGalleryImage['src'], ENT_QUOTES, 'UTF-8'); ?>"
    alt="<?php echo htmlspecialchars((string) $serviceGalleryImage['alt'], ENT_QUOTES, 'UTF-8'); ?>"
>