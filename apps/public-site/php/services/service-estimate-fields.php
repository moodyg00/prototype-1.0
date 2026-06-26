<?php

require_once __DIR__ . '/service-catalog.php';

function get_service_estimate_label(string $serviceType): string {
    $serviceCatalogEntry = get_service_catalog_entry($serviceType);

    return $serviceCatalogEntry['label'] ?? ucwords(str_replace('-', ' ', $serviceType));
}

function get_service_estimate_form_fields(string $serviceType): array {
    $serviceFieldMap = [
        'tv-mounting' => [
            ['name' => 'tv_size_inches', 'label' => 'Average TV size (inches)', 'type' => 'number', 'required' => true, 'min' => 1],
            ['name' => 'wall_type', 'label' => 'Wall type', 'type' => 'select', 'required' => true, 'options' => ['Drywall', 'Concrete/Brick', 'Wood', 'Other']],
            ['name' => 'special_requirements', 'label' => 'Special requirements', 'type' => 'checkboxes', 'options' => ['Cable management', 'Power outlet install', 'Soundbar mount']],
        ],
        'turf-install' => [
            ['name' => 'area_sqft', 'label' => 'Area to cover (square feet)', 'type' => 'number', 'required' => true, 'min' => 1],
            ['name' => 'turf_type', 'label' => 'Turf type', 'type' => 'select', 'required' => true, 'options' => ['Artificial', 'Sod', 'Seed']],
            ['name' => 'current_surface', 'label' => 'Current surface', 'type' => 'select', 'required' => true, 'options' => ['Grass', 'Dirt', 'Gravel', 'Concrete']],
            ['name' => 'site_prep_needed', 'label' => 'Site preparation needed?', 'type' => 'select', 'required' => true, 'options' => ['Yes', 'No']],
            ['name' => 'site_prep_description', 'label' => 'Site preparation description', 'type' => 'textarea', 'rows' => 3],
        ],
        'property-turnover' => [
            ['name' => 'unit_size_rooms', 'label' => 'Unit size / number of rooms', 'type' => 'text', 'required' => true, 'placeholder' => 'Example: 2-bed, 1200 sq ft'],
            ['name' => 'scope_needed', 'label' => 'Scope needed', 'type' => 'checkboxes', 'options' => ['Deep clean', 'Minor repairs', 'Paint touch-up', 'Carpet cleaning']],
            ['name' => 'current_condition', 'label' => 'Current condition', 'type' => 'select', 'required' => true, 'options' => ['Move-out ready', 'Needs light work', 'Heavy turnover']],
        ],
        'pressure-washing' => [
            ['name' => 'area_to_wash', 'label' => 'Area to wash', 'type' => 'text', 'required' => true, 'placeholder' => 'Example: 500 sq ft or 100 linear ft'],
            ['name' => 'surface_type', 'label' => 'Surface type', 'type' => 'select', 'required' => true, 'options' => ['House siding', 'Driveway', 'Deck', 'Fence', 'Other']],
            ['name' => 'stories', 'label' => 'Number of stories', 'type' => 'select', 'required' => true, 'options' => ['1', '2', '3+']],
        ],
        'picture-hanging' => [
            ['name' => 'items_count', 'label' => 'Number of items to hang', 'type' => 'number', 'required' => true, 'min' => 1],
            ['name' => 'average_weight', 'label' => 'Average item weight', 'type' => 'select', 'required' => true, 'options' => ['Light', 'Medium', 'Heavy']],
            ['name' => 'wall_type', 'label' => 'Wall type', 'type' => 'select', 'required' => true, 'options' => ['Drywall', 'Plaster', 'Concrete', 'Other']],
        ],
        'painting' => [
            ['name' => 'area_sqft', 'label' => 'Area to paint (square feet)', 'type' => 'number', 'required' => true, 'min' => 1],
            ['name' => 'rooms_count', 'label' => 'Number of rooms', 'type' => 'number', 'required' => true, 'min' => 1],
            ['name' => 'paint_type', 'label' => 'Paint type', 'type' => 'select', 'required' => true, 'options' => ['Interior walls', 'Ceilings', 'Trim only', 'Exterior']],
            ['name' => 'prep_level', 'label' => 'Prep level needed', 'type' => 'select', 'required' => true, 'options' => ['Light', 'Medium', 'Heavy']],
        ],
        'gutter-cleaning' => [
            ['name' => 'gutter_linear_feet', 'label' => 'Linear feet of gutters', 'type' => 'number', 'required' => true, 'min' => 1],
            ['name' => 'stories', 'label' => 'Number of stories', 'type' => 'select', 'required' => true, 'options' => ['1', '2', '3+']],
        ],
        'furniture-assembly' => [
            ['name' => 'furniture_type', 'label' => 'Furniture type', 'type' => 'select', 'required' => true, 'options' => ['IKEA', 'Generic flat-pack', 'Other']],
        ],
        'fence-repair' => [
            ['name' => 'linear_feet', 'label' => 'Linear feet to repair', 'type' => 'number', 'required' => true, 'min' => 1],
            ['name' => 'fence_type', 'label' => 'Fence type', 'type' => 'select', 'required' => true, 'options' => ['Wood', 'Vinyl', 'Chain link', 'Metal']],
            ['name' => 'repair_type', 'label' => 'Type of repair', 'type' => 'select', 'required' => true, 'options' => ['Panel replacement', 'Post repair', 'Full section', 'Minor']],
        ],
        'drywall-repair' => [
            ['name' => 'patch_size', 'label' => 'Patch size', 'type' => 'text', 'required' => true, 'placeholder' => 'sq ft or reference object, like baseball size'],
            ['name' => 'location', 'label' => 'Location', 'type' => 'select', 'required' => true, 'options' => ['Wall', 'Ceiling']],
        ],
        'deck-repair' => [
            ['name' => 'deck_area_sqft', 'label' => 'Deck area (square feet)', 'type' => 'number', 'required' => true, 'min' => 1],
            ['name' => 'repair_type', 'label' => 'Type of repair', 'type' => 'select', 'required' => true, 'options' => ['Board replacement', 'Rail repair', 'Full section', 'Staining']],
        ],
        'door-repair' => [
            ['name' => 'door_count', 'label' => 'Number of doors needing repair', 'type' => 'number', 'required' => true, 'min' => 1, 'default' => 1],
            ['name' => 'door_type', 'label' => 'Door type', 'type' => 'select', 'required' => true, 'options' => ['Interior door', 'Exterior door', 'Garage door', 'Sliding patio door', 'French doors', 'Other']],
            ['name' => 'door_material', 'label' => 'Door material', 'type' => 'select', 'required' => true, 'options' => ['Wood', 'Metal/Steel', 'Fiberglass', 'Composite', 'Other']],
            ['name' => 'repair_needed', 'label' => 'Type of repair needed', 'type' => 'checkboxes', 'options' => ['Hinge repair/replacement', 'Door frame repair', 'Hole or damage patch', 'Door alignment/sticking fix', 'Lock or handle repair', 'Weatherstripping/sealing', 'Full door replacement', 'Other']],
        ],
        'boat-detailing' => [
            ['name' => 'boat_length_feet', 'label' => 'Boat length (feet)', 'type' => 'number', 'required' => true, 'min' => 1],
            ['name' => 'service_level', 'label' => 'Service level', 'type' => 'select', 'required' => true, 'options' => ['Interior only', 'Exterior only', 'Full detail']],
        ],
        'appliance-install' => [
            ['name' => 'appliance_types', 'label' => 'Appliance types', 'type' => 'checkboxes', 'options' => ['Refrigerator', 'Washer/Dryer', 'Oven', 'Dishwasher', 'Microwave', 'Other']],
            ['name' => 'old_removal_needed', 'label' => 'Removal of old appliances needed?', 'type' => 'select', 'required' => true, 'options' => ['Yes', 'No']],
        ],
        'appliance-repair' => [
            ['name' => 'appliance_type', 'label' => 'Appliance type', 'type' => 'select', 'required' => true, 'options' => ['Refrigerator', 'Washer', 'Dryer', 'Dishwasher', 'Oven/Range', 'Microwave', 'Garbage Disposal', 'Other']],
            ['name' => 'issue_type', 'label' => 'Main issue', 'type' => 'select', 'required' => true, 'options' => ['Not powering on', 'Not heating', 'Not cooling', 'Leaking', 'Not draining', 'Strange noise', 'Error code', 'Other']],
            ['name' => 'unit_age', 'label' => 'Approximate appliance age', 'type' => 'select', 'required' => true, 'options' => ['0-3 years', '4-7 years', '8-12 years', '12+ years', 'Not sure']],
            ['name' => 'repair_notes', 'label' => 'Additional repair notes', 'type' => 'textarea', 'rows' => 3],
        ],
    ];

    return $serviceFieldMap[$serviceType] ?? [
        ['name' => 'project_type', 'label' => 'Project type', 'type' => 'text', 'required' => true],
        ['name' => 'project_scope', 'label' => 'Project details', 'type' => 'textarea', 'rows' => 4, 'required' => true],
    ];
}