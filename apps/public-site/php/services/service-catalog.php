<?php

function get_service_catalog(): array {
    return [
        'pressure-washing' => ['label' => 'Pressure Washing', 'href' => 'pressure-washing.php', 'icon' => 'icon/hose-white.png', 'alt' => 'pressure washing', 'description' => 'Restore your home’s exterior with powerful, professional pressure washing that removes dirt, mold, and grime.'],
        'appliance-repair' => ['label' => 'Appliance Repair', 'href' => 'appliance-repair.php', 'icon' => 'icon/washer-white.png', 'alt' => '', 'description' => 'Fast diagnostics and reliable repair for refrigerators, washers, dryers, dishwashers, ovens, and other household appliances.'],
        'appliance-install' => ['label' => 'Appliance Installation', 'href' => 'appliance-install.php', 'icon' => 'icon/washer-white.png', 'alt' => '', 'description' => 'Safe and correct installation of refrigerators, washers, dryers, ovens, and more — with old unit haul away available.'],
        'furniture-assembly' => ['label' => 'Furniture Assembly', 'href' => 'furniture-assembly.php', 'icon' => 'icon/bed-bunk-white.png', 'alt' => '', 'description' => 'Fast, expert assembly of IKEA, Amazon, and all ready-to-assemble furniture so you can enjoy it the same day.'],
        'tv-mounting' => ['label' => 'TV Mounting', 'href' => 'tv-mounting.php', 'icon' => 'icon/tv-white.png', 'alt' => '', 'description' => 'Secure, clean TV wall mounting with perfect positioning and professional cable hiding.'],
        'painting' => ['label' => 'Interior & Exterior Painting', 'href' => 'painting.php', 'icon' => 'icon/paint-white.png', 'alt' => '', 'description' => 'High-quality painting services with excellent prep work for a flawless, long-lasting finish.'],
        'drywall-repair' => ['label' => 'Drywall Repair', 'href' => 'drywall-repair.php', 'icon' => 'icon/drywall-white.png', 'alt' => '', 'description' => 'Seamless drywall repairs for holes, cracks, water damage, and texture matching.'],
        'picture-hanging' => ['label' => 'Picture Hanging & Gallery Walls', 'href' => 'picture-hanging.php', 'icon' => 'icon/picture-white.png', 'alt' => '', 'description' => 'Precise, level picture hanging and beautiful gallery wall installations.'],
        'door-repair' => ['label' => 'Door Repair', 'href' => 'door-repair.php', 'icon' => 'icon/door-white.png', 'alt' => '', 'description' => 'Fix sticking doors, broken locks, damaged frames, and hardware issues.'],
        'deck-repair' => ['label' => 'Deck Repair', 'href' => 'deck-repair.php', 'icon' => 'icon/deck-white.png', 'alt' => '', 'description' => 'Expert deck repairs including rotten boards, railings, stairs, and structural fixes.'],
        'fence-repair' => ['label' => 'Fence Repair', 'href' => 'fence-repair.php', 'icon' => 'icon/fence-white.png', 'alt' => 'fence repair', 'description' => 'Professional fence repairs for wood, vinyl, and chain link to restore privacy and safety.'],
        'gutter-cleaning' => ['label' => 'Gutter Cleaning', 'href' => 'gutter-cleaning.php', 'icon' => 'icon/gutter-white.png', 'alt' => 'gutter cleaning', 'description' => 'Keep your home protected with thorough gutter cleaning and downspout flushing.'],
        'boat-detailing' => ['label' => 'Boat Detailing', 'href' => 'boat-detailing.php', 'icon' => 'icon/boat-white.png', 'alt' => 'boat detailing', 'description' => 'Premium boat detailing at Lake Travis and Austin area marinas — hull cleaning, waxing & polishing.'],
        'turf-install' => ['label' => 'Artificial Turf Installation', 'href' => 'turf-install.php', 'icon' => 'icon/turf-white.png', 'alt' => 'turf install/cleaning', 'description' => 'High-quality artificial turf installation for beautiful, low-maintenance lawns.'],
        'property-turnover' => ['label' => 'Rental Property Turnover', 'href' => 'property-turnover.php', 'icon' => 'icon/rental.png', 'alt' => 'property turnover', 'description' => 'Full make-ready services for landlords — repairs, deep cleaning, rekeying & junk removal.'],
    ];
}

function get_service_catalog_entry(string $serviceType): ?array {
    $serviceCatalog = get_service_catalog();

    return $serviceCatalog[$serviceType] ?? null;
}

function get_home_service_cards(): array {
    $homeServiceCards = [];

    foreach (get_service_catalog() as $slug => $service) {
        $homeServiceCards[] = [
            'slug' => $slug,
            'icon' => $service['icon'],
            'alt' => $service['alt'],
            'title' => $service['label'],
            'description' => $service['description'],
        ];
    }

    return $homeServiceCards;
}