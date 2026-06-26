<?php

function get_service_gallery_images(string $serviceType): array {
    $serviceLabel = ucwords(str_replace('-', ' ', $serviceType));

    $primaryImages = [
        'appliance-install' => ['src' => '/images/appliance-installation.jpg', 'alt' => 'Professional appliance installation in Austin TX'],
        'appliance-repair' => ['src' => '/images/appliance-installation.jpg', 'alt' => 'Appliance repair and service in Austin TX'],
        'boat-detailing' => ['src' => '/images/boat-detailing-1.jpg', 'alt' => 'Professional boat detailing on Lake Travis Austin TX'],
        'deck-repair' => ['src' => '/images/deck-repair.jpg', 'alt' => 'Professional deck repair in Austin TX'],
        'door-repair' => ['src' => '/images/door-repair.jpg', 'alt' => 'Professional door repair in Austin TX'],
        'drywall-repair' => ['src' => '/images/drywall-repair.jpg', 'alt' => 'Professional drywall repair in Austin TX'],
        'fence-repair' => ['src' => '/images/fence-repair-1.jpg', 'alt' => 'Professional fence repair in Austin TX'],
        'furniture-assembly' => ['src' => '/images/furniture-assembly.jpg', 'alt' => 'Professional furniture assembly in Austin TX'],
        'gutter-cleaning' => ['src' => '/images/gutter-cleaning.jpg', 'alt' => 'Professional gutter cleaning in Austin TX'],
        'painting' => ['src' => '/images/painting.jpg', 'alt' => 'Professional house painting in Austin TX'],
        'picture-hanging' => ['src' => '/images/picture-hanging.jpg', 'alt' => 'Professional picture hanging in Austin'],
        'pressure-washing' => ['src' => '/images/pressure-washing-1.jpg', 'alt' => 'Pressure washing service in Austin TX'],
        'property-turnover' => ['src' => '/images/property-turnover-1.jpg', 'alt' => 'Rental property turnover services in Austin TX'],
        'turf-install' => ['src' => '/images/turf-installation-1.jpg', 'alt' => 'Turf installation project in Austin TX'],
        'tv-mounting' => ['src' => '/images/tv-mounting.jpg', 'alt' => 'Professional TV mounting in Austin TX'],
    ];

    $generalUsePool = [3, 6, 9, 12, 15, 18, 20, 23, 24, 27, 29, 32, 34, 36];
    $galleryImages = [];

    if (isset($primaryImages[$serviceType])) {
        $galleryImages[] = $primaryImages[$serviceType];
    }

    $poolSize = count($generalUsePool);
    $offset = $poolSize > 0 ? abs((int) crc32($serviceType)) % $poolSize : 0;

    for ($index = 0; count($galleryImages) < 5 && $index < $poolSize; $index++) {
        $imageNumber = $generalUsePool[($offset + $index) % $poolSize];
        $galleryImages[] = [
            'src' => '/images/general_use-' . $imageNumber . '.jpg',
            'alt' => $serviceLabel . ' project photo ' . (count($galleryImages) + 1),
        ];
    }

    return array_slice($galleryImages, 0, 5);
}