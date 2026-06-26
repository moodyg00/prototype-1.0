<?php

function get_service_estimate_fallback_result(string $serviceType): array {
    $fallbackResults = [
        'appliance-install' => [
            'amount' => '$185',
            'summary' => [
                'This looks like a standard appliance install with a straightforward hookup and finish check.',
                'Photos of the connection area and the appliance model help confirm whether the final scope stays at this number.',
            ],
        ],
        'appliance-repair' => [
            'amount' => '$245',
            'summary' => [
                'This reads like a repair that is likely worth servicing before jumping to replacement.',
                'A model number photo and one close-up of the problem area usually helps confirm parts and keep the estimate tighter.',
            ],
        ],
        'boat-detailing' => [
            'amount' => '$360',
            'summary' => [
                'This looks closest to a mid-level detail with enough work to clean up the finish and presentation noticeably.',
                'Photos of oxidation, interior seating, and the hull condition would help confirm whether the final price stays near this number.',
            ],
        ],
        'deck-repair' => [
            'amount' => '$680',
            'summary' => [
                'This looks like a practical repair scope rather than a full deck rebuild, which keeps the estimate in a workable range.',
                'A few wide photos plus one close-up of the damaged boards or rails would help confirm lumber count and hardware needs.',
            ],
        ],
        'door-repair' => [
            'amount' => '$210',
            'summary' => [
                'This appears closer to a standard repair visit than a full replacement, which is why the number stays moderate.',
                'A photo of the full door and one of the damaged area usually helps confirm whether parts or frame work change the scope.',
            ],
        ],
        'drywall-repair' => [
            'amount' => '$225',
            'summary' => [
                'This looks like a typical drywall repair with patching, blending, and prep for a clean finish.',
                'A photo with scale and one wider room shot would help confirm whether texture matching or paint touchup should be added.',
            ],
        ],
        'fence-repair' => [
            'amount' => '$340',
            'summary' => [
                'This looks like a focused fence repair rather than a large section rebuild, so the estimate stays centered on labor and materials for one visit.',
                'Photos of the damaged run and the posts help confirm whether the final number changes because of reset or concrete work.',
            ],
        ],
        'furniture-assembly' => [
            'amount' => '$120',
            'summary' => [
                'This looks like a standard assembly job with enough complexity to justify a single scheduled setup visit.',
                'A product link or box photo usually helps confirm assembly time and whether anchoring or placement support changes the scope.',
            ],
        ],
        'gutter-cleaning' => [
            'amount' => '$210',
            'summary' => [
                'This looks like a typical gutter cleanout and flow check without major repair work built in.',
                'A front elevation photo and note about story count usually help confirm access time and whether debris load pushes the total up.',
            ],
        ],
        'painting' => [
            'amount' => '$540',
            'summary' => [
                'This reads like a smaller paint scope where prep quality will matter as much as the square footage.',
                'Wide room photos and a note on wall condition help confirm whether patching, trim work, or extra coats should change the estimate.',
            ],
        ],
        'picture-hanging' => [
            'amount' => '$135',
            'summary' => [
                'This looks like a straightforward hanging visit with time for layout, leveling, and clean placement.',
                'A count of the pieces plus wall photos usually helps confirm whether anchors, masonry tools, or ladder setup affect the final number.',
            ],
        ],
        'pressure-washing' => [
            'amount' => '$275',
            'summary' => [
                'This looks like a standard pressure-washing scope with enough area to plan for a full dedicated visit.',
                'Photos showing buildup level and access around the house help confirm whether detergent treatment or heavier cleaning changes the total.',
            ],
        ],
        'property-turnover' => [
            'amount' => '$1,120',
            'summary' => [
                'This feels like a moderate turnover scope with enough moving parts that coordination matters as much as the repair list itself.',
                'Photos room by room and a quick note on deadlines help confirm whether the final scope stays closer to light touchup or a heavier reset.',
            ],
        ],
        'turf-install' => [
            'amount' => '$2,850',
            'summary' => [
                'This looks like a mid-size turf install where prep and base work are doing most of the pricing work.',
                'Wide yard photos and rough square footage help confirm whether edging, drainage, or removal work should move the estimate.',
            ],
        ],
        'tv-mounting' => [
            'amount' => '$165',
            'summary' => [
                'This looks like a standard mount install with time for placement, hardware, and a clean final setup.',
                'A wall photo and TV size help confirm whether concealment, outlet work, or unusual wall conditions should change the final number.',
            ],
        ],
    ];

    return $fallbackResults[$serviceType] ?? [
        'amount' => '$250',
        'summary' => [
            'This looks like a workable starter estimate based on the service type and the details provided.',
            'Photos and a clearer scope note would help tighten the number before scheduling.',
        ],
    ];
}