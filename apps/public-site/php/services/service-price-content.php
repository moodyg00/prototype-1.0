<?php

function get_service_price_content(string $serviceType): string {
    $servicePriceContent = [
        'appliance-install' => '<strong>$100–$250</strong> depending on the appliance type, location, electrical/gas/water connections, and whether you need old appliance haul-away. Most standard installations fall between $125–$200.',
        'appliance-repair' => '<strong>$100–$500</strong> depending on the appliance type and issue. Simple repairs like thermostat or seal replacements usually start around $100–$150. More complex repairs like motor or compressor replacements typically range from $250–$500. We provide a clear on-site quote after diagnosing the problem.',
        'boat-detailing' => '<strong>$200–$500+</strong> depending on boat size and condition. A typical 20–25 foot boat usually costs $300–$400. Larger 35–45 foot boats or heavily oxidized vessels can range from $450–$700+. We provide a clear quote after seeing your boat.',
        'deck-repair' => '<strong>$300–$1,000+</strong> depending on the extent of damage. Simple board replacements or minor fixes usually start around $350–$500. Larger structural repairs, multiple sections, or railing work typically range from $700–$1,500. We provide a clear on-site quote after inspection.',
        'door-repair' => '<strong>$100–$500</strong> depending on the issue. Simple lock adjustments or hinge repairs usually start around $100–$150. Full frame repairs or complex fixes typically range from $250–$500. We provide a clear on-site quote after inspection.',
        'drywall-repair' => '',
        'fence-repair' => '<strong>$200–$400</strong> for simple repairs like replacing a few boards or fixing a gate. <strong>$400–$800</strong> for moderate repairs including multiple panels or structural fixes. <strong>$800+</strong> for extensive repairs or larger sections of fencing. We always provide a clear, on-site quote.',
        'furniture-assembly' => '<strong>$50–$200</strong> depending on the piece and complexity. A simple bookshelf or small desk usually costs around $75. Larger items like entertainment centers, beds, or wardrobes typically run $125–$200',
        'gutter-cleaning' => '<strong>$150–$300</strong> depending on house size, number of stories, and gutter condition. A typical single-story home usually costs around $200. Two-story homes or heavily clogged gutters cost more.',
        'painting' => '<strong>$150–$300</strong> for small rooms, hallways, and bathrooms. <strong>$500–$2,000+</strong> for full interior projects depending on size, prep work, and paint quality. Interior painting typically runs $2–$4 per square foot. Exterior house painting starts around $1,000 for small homes and can reach $5,000+ for larger two-story homes.',
        'picture-hanging' => '<strong>$100–$150</strong> depending on the number and size of frames. Hanging 5–10 standard frames usually costs around $100. Larger gallery walls or heavy pieces cost more.',
        'pressure-washing' => '<strong>$150–$400</strong> depending on house size and surface type. A typical 1,500 sq ft single-story home usually runs around $250. Larger two-story homes or properties with heavy mold can reach $350–$400.',
        'property-turnover' => '<strong>$500–$2,000+</strong> depending on property size, condition, and repairs needed. A typical 2–3 bedroom single-family home usually falls between $750–$1,400. We provide a detailed quote after the initial move-out inspection.',
        'turf-install' => '<strong>$1,500–$5,000</strong> depending on square footage and site preparation. A typical 500 sq ft backyard in Austin runs around $2,500. Costs vary based on drainage work, base materials, and infill type—we\'ll give you a clear quote after a free on-site visit.',
        'tv-mounting' => '<strong>$100–$300</strong> depending on TV size, wall type, and mounting complexity. A standard 40–55 inch TV usually costs around $150. Larger TVs or complex installations with additional wiring or mounts can reach $300.',
    ];

    return $servicePriceContent[$serviceType] ?? '';
}