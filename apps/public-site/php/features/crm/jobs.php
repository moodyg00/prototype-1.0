<?php

require_once __DIR__ . '/../../services/service-catalog.php';

function get_crm_job_status_options(): array {
    return [
        'scheduled' => 'Scheduled',
        'in-progress' => 'In Progress',
        'completed' => 'Completed',
        'on-hold' => 'On Hold',
        'cancelled' => 'Cancelled',
    ];
}

function get_crm_job_service_options(): array {
    $options = ['' => 'General Handyman'];

    foreach (get_service_catalog() as $serviceKey => $serviceEntry) {
        $options[$serviceKey] = $serviceEntry['label'];
    }

    return $options;
}

function build_blank_job_record(): array {
    return [
        'id' => '',
        'title' => '',
        'status' => 'scheduled',
        'service_key' => '',
        'customer_id' => '',
        'lead_id' => '',
        'location' => '',
        'scheduled_for' => '',
        'notes' => '',
        'allow_duplicate_for_lead' => '',
        'created_at' => '',
        'updated_at' => '',
    ];
}