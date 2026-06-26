<?php

function get_crm_customer_status_options(): array {
    return [
        'prospect' => 'Prospect',
        'active' => 'Active',
        'repeat' => 'Repeat',
        'archived' => 'Archived',
    ];
}

function build_blank_customer_record(): array {
    return [
        'id' => '',
        'name' => '',
        'status' => 'prospect',
        'phone' => '',
        'email' => '',
        'location' => '',
        'notes' => '',
        'created_at' => '',
        'updated_at' => '',
    ];
}