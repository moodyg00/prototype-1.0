<?php

require_once __DIR__ . '/../../services/service-catalog.php';

function get_crm_lead_status_options(): array {
    return [
        'new' => 'New',
        'contacted' => 'Contacted',
        'quoted' => 'Quoted',
        'booked' => 'Booked',
        'archived' => 'Archived',
    ];
}

function get_crm_lead_source_options(): array {
    return [
        'text' => 'Text',
        'call' => 'Call',
        'website' => 'Website',
        'referral' => 'Referral',
        'repeat' => 'Repeat Customer',
    ];
}

function get_crm_lead_service_options(): array {
    $options = ['' => 'General Inquiry'];

    foreach (get_service_catalog() as $serviceKey => $serviceEntry) {
        $options[$serviceKey] = $serviceEntry['label'];
    }

    return $options;
}

function build_blank_lead_record(): array {
    return [
        'id' => '',
        'name' => '',
        'status' => 'new',
        'service_key' => '',
        'customer_id' => '',
        'phone' => '',
        'source' => 'website',
        'location' => '',
        'notes' => '',
        'activity' => [],
        'activity_note' => '',
        'created_at' => '',
        'updated_at' => '',
    ];
}