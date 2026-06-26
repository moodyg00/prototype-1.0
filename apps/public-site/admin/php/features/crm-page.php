<?php

require_once __DIR__ . '/../../../php/repositories/leads.php';
require_once __DIR__ . '/../../../php/repositories/customers.php';
require_once __DIR__ . '/../../../php/repositories/jobs.php';

function build_crm_return_url(array $params = []): string {
    return 'crm.php' . (!empty($params) ? '?' . http_build_query($params) : '');
}

function build_crm_section_url(array $params = [], string $fragment = ''): string {
    $url = build_crm_return_url(array_filter($params, static function ($value): bool {
        return $value !== '' && $value !== null;
    }));

    if ($fragment !== '') {
        $url .= '#' . $fragment;
    }

    return $url;
}

function build_crm_notice_message(?string $notice): ?array {
    $messages = [
        'lead-saved' => ['message' => 'Lead saved.', 'tone' => 'success'],
        'lead-created' => ['message' => 'Lead created.', 'tone' => 'success'],
        'lead-deleted' => ['message' => 'Lead deleted.', 'tone' => 'success'],
        'lead-booked' => ['message' => 'Lead marked booked.', 'tone' => 'success'],
        'lead-archived' => ['message' => 'Lead archived.', 'tone' => 'success'],
        'customer-saved' => ['message' => 'Customer saved.', 'tone' => 'success'],
        'customer-created' => ['message' => 'Customer created.', 'tone' => 'success'],
        'customer-deleted' => ['message' => 'Customer deleted.', 'tone' => 'success'],
        'customer-archived' => ['message' => 'Customer archived.', 'tone' => 'success'],
        'customer-restored' => ['message' => 'Customer restored to active.', 'tone' => 'success'],
        'job-saved' => ['message' => 'Job saved.', 'tone' => 'success'],
        'job-created' => ['message' => 'Job created.', 'tone' => 'success'],
        'job-deleted' => ['message' => 'Job deleted.', 'tone' => 'success'],
        'job-completed' => ['message' => 'Job marked complete.', 'tone' => 'success'],
        'job-reopened' => ['message' => 'Job reopened.', 'tone' => 'success'],
    ];

    return $messages[(string) $notice] ?? null;
}

function build_posted_lead_record(array $post): array {
    return array_merge(
        build_blank_lead_record(),
        [
            'id' => trim((string) ($post['id'] ?? '')),
            'name' => trim((string) ($post['name'] ?? '')),
            'status' => trim((string) ($post['status'] ?? 'new')),
            'service_key' => trim((string) ($post['service_key'] ?? '')),
            'customer_id' => trim((string) ($post['customer_id'] ?? '')),
            'phone' => trim((string) ($post['phone'] ?? '')),
            'source' => trim((string) ($post['source'] ?? 'website')),
            'location' => trim((string) ($post['location'] ?? '')),
            'notes' => trim((string) ($post['notes'] ?? '')),
            'activity_note' => trim((string) ($post['activity_note'] ?? '')),
        ]
    );
}

function build_posted_customer_record(array $post): array {
    return array_merge(
        build_blank_customer_record(),
        [
            'id' => trim((string) ($post['customer_id'] ?? $post['id'] ?? '')),
            'name' => trim((string) ($post['customer_name'] ?? $post['name'] ?? '')),
            'status' => trim((string) ($post['customer_status'] ?? $post['status'] ?? 'prospect')),
            'phone' => trim((string) ($post['customer_phone'] ?? $post['phone'] ?? '')),
            'email' => trim((string) ($post['customer_email'] ?? $post['email'] ?? '')),
            'location' => trim((string) ($post['customer_location'] ?? $post['location'] ?? '')),
            'notes' => trim((string) ($post['customer_notes'] ?? $post['notes'] ?? '')),
        ]
    );
}

function build_posted_job_record(array $post): array {
    return array_merge(
        build_blank_job_record(),
        [
            'id' => trim((string) ($post['job_id'] ?? $post['id'] ?? '')),
            'title' => trim((string) ($post['job_title'] ?? $post['title'] ?? '')),
            'status' => trim((string) ($post['job_status'] ?? $post['status'] ?? 'scheduled')),
            'service_key' => trim((string) ($post['job_service_key'] ?? $post['service_key'] ?? '')),
            'customer_id' => trim((string) ($post['job_customer_id'] ?? $post['customer_id'] ?? '')),
            'lead_id' => trim((string) ($post['job_lead_id'] ?? $post['lead_id'] ?? '')),
            'location' => trim((string) ($post['job_location'] ?? $post['location'] ?? '')),
            'scheduled_for' => trim((string) ($post['job_scheduled_for'] ?? $post['scheduled_for'] ?? '')),
            'notes' => trim((string) ($post['job_notes'] ?? $post['notes'] ?? '')),
            'allow_duplicate_for_lead' => trim((string) ($post['allow_duplicate_for_lead'] ?? '')),
        ]
    );
}

function resolve_selected_lead_record(string $selectedLeadId, bool $isCreating, ?string $error, array $post): array {
    if ($error !== null && !empty($post)) {
        return build_posted_lead_record($post);
    }

    if ($isCreating) {
        return build_blank_lead_record();
    }

    if ($selectedLeadId !== '') {
        return get_lead_record_by_id($selectedLeadId) ?? build_blank_lead_record();
    }

    return build_blank_lead_record();
}

function resolve_selected_customer_record(string $selectedCustomerId, bool $isCreating, ?string $error, array $post): array {
    if ($error !== null && !empty($post)) {
        return build_posted_customer_record($post);
    }

    if ($isCreating) {
        return build_blank_customer_record();
    }

    if ($selectedCustomerId !== '') {
        return get_customer_record_by_id($selectedCustomerId) ?? build_blank_customer_record();
    }

    return build_blank_customer_record();
}

function resolve_selected_job_record(string $selectedJobId, bool $isCreating, ?string $error, array $post): array {
    if ($error !== null && !empty($post)) {
        return build_posted_job_record($post);
    }

    if ($isCreating) {
        return build_blank_job_record();
    }

    if ($selectedJobId !== '') {
        return get_job_record_by_id($selectedJobId) ?? build_blank_job_record();
    }

    return build_blank_job_record();
}

function resolve_selected_job_record_from_lead(string $sourceLeadId): array {
    $leadRecord = get_lead_record_by_id($sourceLeadId);
    if ($leadRecord === null) {
        return build_blank_job_record();
    }

    $serviceKey = trim((string) ($leadRecord['service_key'] ?? ''));
    $serviceLabel = get_crm_job_service_options()[$serviceKey] ?? 'General Handyman';
    $leadName = trim((string) ($leadRecord['name'] ?? 'Lead'));
    $leadNotes = trim((string) ($leadRecord['notes'] ?? ''));

    return array_merge(build_blank_job_record(), [
        'title' => $leadName . ' ' . strtolower($serviceLabel),
        'service_key' => $serviceKey,
        'customer_id' => trim((string) ($leadRecord['customer_id'] ?? '')),
        'lead_id' => (string) ($leadRecord['id'] ?? ''),
        'location' => trim((string) ($leadRecord['location'] ?? '')),
        'notes' => $leadNotes !== '' ? "Created from lead:\n" . $leadNotes : 'Created from lead.',
    ]);
}

function count_leads_summary(array $records): array {
    $summary = [
        'total' => count($records),
        'new' => 0,
        'booked' => 0,
    ];

    foreach ($records as $record) {
        $status = (string) ($record['status'] ?? '');
        if ($status === 'new') {
            $summary['new']++;
        }
        if ($status === 'booked') {
            $summary['booked']++;
        }
    }

    return $summary;
}

function count_customers_summary(array $records): array {
    $summary = [
        'total' => count($records),
        'active' => 0,
        'repeat' => 0,
    ];

    foreach ($records as $record) {
        $status = (string) ($record['status'] ?? '');
        if ($status === 'active') {
            $summary['active']++;
        }
        if ($status === 'repeat') {
            $summary['repeat']++;
        }
    }

    return $summary;
}

function count_jobs_summary(array $records): array {
    $summary = [
        'total' => count($records),
        'scheduled' => 0,
        'active' => 0,
    ];

    foreach ($records as $record) {
        $status = (string) ($record['status'] ?? '');
        if ($status === 'scheduled') {
            $summary['scheduled']++;
        }
        if ($status === 'in-progress') {
            $summary['active']++;
        }
    }

    return $summary;
}

function build_customer_option_map(array $records): array {
    $options = ['' => 'No customer linked'];

    foreach ($records as $record) {
        $id = trim((string) ($record['id'] ?? ''));
        if ($id === '') {
            continue;
        }

        $options[$id] = (string) ($record['name'] ?? 'Customer');
    }

    return $options;
}

function build_lead_option_map(array $records): array {
    $options = ['' => 'No lead linked'];

    foreach ($records as $record) {
        $id = trim((string) ($record['id'] ?? ''));
        if ($id === '') {
            continue;
        }

        $options[$id] = (string) ($record['name'] ?? 'Lead');
    }

    return $options;
}

function read_crm_filters(array $query): array {
    return [
        'lead_status' => trim((string) ($query['lead_status'] ?? '')),
        'lead_service_key' => trim((string) ($query['lead_service_key'] ?? '')),
        'lead_customer_id' => trim((string) ($query['lead_customer_id'] ?? '')),
        'lead_sort' => trim((string) ($query['lead_sort'] ?? 'updated_desc')),
        'customer_status' => trim((string) ($query['customer_status'] ?? '')),
        'customer_sort' => trim((string) ($query['customer_sort'] ?? 'updated_desc')),
        'job_status' => trim((string) ($query['job_status'] ?? '')),
        'job_service_key' => trim((string) ($query['job_service_key'] ?? '')),
        'job_customer_id' => trim((string) ($query['job_customer_id'] ?? '')),
        'job_sort' => trim((string) ($query['job_sort'] ?? 'updated_desc')),
    ];
}

function get_crm_lead_sort_options(): array {
    return [
        'updated_desc' => 'Newest activity',
        'updated_asc' => 'Oldest activity',
        'name_asc' => 'Name A-Z',
        'status_asc' => 'Status',
    ];
}

function get_crm_customer_sort_options(): array {
    return [
        'updated_desc' => 'Newest activity',
        'updated_asc' => 'Oldest activity',
        'name_asc' => 'Name A-Z',
        'status_asc' => 'Status',
    ];
}

function get_crm_job_sort_options(): array {
    return [
        'updated_desc' => 'Newest activity',
        'updated_asc' => 'Oldest activity',
        'title_asc' => 'Title A-Z',
        'scheduled_asc' => 'Soonest schedule',
        'status_asc' => 'Status',
    ];
}

function compare_crm_datetime(string $leftValue, string $rightValue, string $direction = 'desc'): int {
    $comparison = strcmp($leftValue, $rightValue);
    return $direction === 'asc' ? $comparison : -$comparison;
}

function filter_lead_records(array $records, array $filters): array {
    $filtered = array_values(array_filter($records, static function (array $record) use ($filters): bool {
        if (($filters['lead_status'] ?? '') !== '' && (string) ($record['status'] ?? '') !== (string) $filters['lead_status']) {
            return false;
        }

        if (($filters['lead_service_key'] ?? '') !== '' && (string) ($record['service_key'] ?? '') !== (string) $filters['lead_service_key']) {
            return false;
        }

        if (($filters['lead_customer_id'] ?? '') !== '' && (string) ($record['customer_id'] ?? '') !== (string) $filters['lead_customer_id']) {
            return false;
        }

        return true;
    }));

    $sort = $filters['lead_sort'] ?? 'updated_desc';
    usort($filtered, static function (array $left, array $right) use ($sort): int {
        if ($sort === 'updated_asc') {
            return compare_crm_datetime((string) ($left['updated_at'] ?? ''), (string) ($right['updated_at'] ?? ''), 'asc');
        }
        if ($sort === 'name_asc') {
            return strcasecmp((string) ($left['name'] ?? ''), (string) ($right['name'] ?? ''));
        }
        if ($sort === 'status_asc') {
            return strcasecmp((string) ($left['status'] ?? ''), (string) ($right['status'] ?? ''));
        }

        return compare_crm_datetime((string) ($left['updated_at'] ?? ''), (string) ($right['updated_at'] ?? ''), 'desc');
    });

    return $filtered;
}

function filter_customer_records(array $records, array $filters): array {
    $filtered = array_values(array_filter($records, static function (array $record) use ($filters): bool {
        if (($filters['customer_status'] ?? '') !== '' && (string) ($record['status'] ?? '') !== (string) $filters['customer_status']) {
            return false;
        }

        return true;
    }));

    $sort = $filters['customer_sort'] ?? 'updated_desc';
    usort($filtered, static function (array $left, array $right) use ($sort): int {
        if ($sort === 'updated_asc') {
            return compare_crm_datetime((string) ($left['updated_at'] ?? ''), (string) ($right['updated_at'] ?? ''), 'asc');
        }
        if ($sort === 'name_asc') {
            return strcasecmp((string) ($left['name'] ?? ''), (string) ($right['name'] ?? ''));
        }
        if ($sort === 'status_asc') {
            return strcasecmp((string) ($left['status'] ?? ''), (string) ($right['status'] ?? ''));
        }

        return compare_crm_datetime((string) ($left['updated_at'] ?? ''), (string) ($right['updated_at'] ?? ''), 'desc');
    });

    return $filtered;
}

function filter_job_records(array $records, array $filters): array {
    $filtered = array_values(array_filter($records, static function (array $record) use ($filters): bool {
        if (($filters['job_status'] ?? '') !== '' && (string) ($record['status'] ?? '') !== (string) $filters['job_status']) {
            return false;
        }

        if (($filters['job_service_key'] ?? '') !== '' && (string) ($record['service_key'] ?? '') !== (string) $filters['job_service_key']) {
            return false;
        }

        if (($filters['job_customer_id'] ?? '') !== '' && (string) ($record['customer_id'] ?? '') !== (string) $filters['job_customer_id']) {
            return false;
        }

        return true;
    }));

    $sort = $filters['job_sort'] ?? 'updated_desc';
    usort($filtered, static function (array $left, array $right) use ($sort): int {
        if ($sort === 'updated_asc') {
            return compare_crm_datetime((string) ($left['updated_at'] ?? ''), (string) ($right['updated_at'] ?? ''), 'asc');
        }
        if ($sort === 'title_asc') {
            return strcasecmp((string) ($left['title'] ?? ''), (string) ($right['title'] ?? ''));
        }
        if ($sort === 'scheduled_asc') {
            $leftValue = (string) ($left['scheduled_for'] ?? '');
            $rightValue = (string) ($right['scheduled_for'] ?? '');
            if ($leftValue === '' && $rightValue === '') {
                return 0;
            }
            if ($leftValue === '') {
                return 1;
            }
            if ($rightValue === '') {
                return -1;
            }
            return strcmp($leftValue, $rightValue);
        }
        if ($sort === 'status_asc') {
            return strcasecmp((string) ($left['status'] ?? ''), (string) ($right['status'] ?? ''));
        }

        return compare_crm_datetime((string) ($left['updated_at'] ?? ''), (string) ($right['updated_at'] ?? ''), 'desc');
    });

    return $filtered;
}

function count_customer_related_leads(array $leadRecords, string $customerId): int {
    $count = 0;

    foreach ($leadRecords as $record) {
        if ((string) ($record['customer_id'] ?? '') === $customerId) {
            $count++;
        }
    }

    return $count;
}

function count_customer_related_jobs(array $jobRecords, string $customerId): int {
    $count = 0;

    foreach ($jobRecords as $record) {
        if ((string) ($record['customer_id'] ?? '') === $customerId) {
            $count++;
        }
    }

    return $count;
}

function get_customer_related_lead_records(array $leadRecords, string $customerId): array {
    return array_values(array_filter($leadRecords, static function (array $record) use ($customerId): bool {
        return (string) ($record['customer_id'] ?? '') === $customerId;
    }));
}

function get_customer_related_job_records(array $jobRecords, string $customerId): array {
    return array_values(array_filter($jobRecords, static function (array $record) use ($customerId): bool {
        return (string) ($record['customer_id'] ?? '') === $customerId;
    }));
}

function build_crm_filter_chip(string $label, array $params, string $fragment): array {
    return [
        'label' => $label,
        'href' => build_crm_section_url($params, $fragment),
    ];
}

function build_lead_filter_chips(array $filters, array $statusOptions, array $serviceOptions, array $customerOptions): array {
    $chips = [];
    $baseParams = [
        'lead_status' => $filters['lead_status'] ?? '',
        'lead_service_key' => $filters['lead_service_key'] ?? '',
        'lead_customer_id' => $filters['lead_customer_id'] ?? '',
        'lead_sort' => $filters['lead_sort'] ?? 'updated_desc',
    ];

    if (($filters['lead_status'] ?? '') !== '') {
        $params = $baseParams;
        $params['lead_status'] = '';
        $chips[] = build_crm_filter_chip('Status: ' . ($statusOptions[$filters['lead_status']] ?? $filters['lead_status']), $params, 'crm-leads');
    }

    if (($filters['lead_service_key'] ?? '') !== '') {
        $params = $baseParams;
        $params['lead_service_key'] = '';
        $chips[] = build_crm_filter_chip('Service: ' . ($serviceOptions[$filters['lead_service_key']] ?? $filters['lead_service_key']), $params, 'crm-leads');
    }

    if (($filters['lead_customer_id'] ?? '') !== '') {
        $params = $baseParams;
        $params['lead_customer_id'] = '';
        $chips[] = build_crm_filter_chip('Customer: ' . ($customerOptions[$filters['lead_customer_id']] ?? $filters['lead_customer_id']), $params, 'crm-leads');
    }

    return $chips;
}

function build_customer_filter_chips(array $filters, array $statusOptions): array {
    $chips = [];

    if (($filters['customer_status'] ?? '') !== '') {
        $chips[] = build_crm_filter_chip(
            'Status: ' . ($statusOptions[$filters['customer_status']] ?? $filters['customer_status']),
            [
                'customer_status' => '',
                'customer_sort' => $filters['customer_sort'] ?? 'updated_desc',
            ],
            'crm-customers'
        );
    }

    return $chips;
}

function build_job_filter_chips(array $filters, array $statusOptions, array $serviceOptions, array $customerOptions): array {
    $chips = [];
    $baseParams = [
        'job_status' => $filters['job_status'] ?? '',
        'job_service_key' => $filters['job_service_key'] ?? '',
        'job_customer_id' => $filters['job_customer_id'] ?? '',
        'job_sort' => $filters['job_sort'] ?? 'updated_desc',
    ];

    if (($filters['job_status'] ?? '') !== '') {
        $params = $baseParams;
        $params['job_status'] = '';
        $chips[] = build_crm_filter_chip('Status: ' . ($statusOptions[$filters['job_status']] ?? $filters['job_status']), $params, 'crm-jobs');
    }

    if (($filters['job_service_key'] ?? '') !== '') {
        $params = $baseParams;
        $params['job_service_key'] = '';
        $chips[] = build_crm_filter_chip('Service: ' . ($serviceOptions[$filters['job_service_key']] ?? $filters['job_service_key']), $params, 'crm-jobs');
    }

    if (($filters['job_customer_id'] ?? '') !== '') {
        $params = $baseParams;
        $params['job_customer_id'] = '';
        $chips[] = build_crm_filter_chip('Customer: ' . ($customerOptions[$filters['job_customer_id']] ?? $filters['job_customer_id']), $params, 'crm-jobs');
    }

    return $chips;
}

function build_crm_sort_label(string $selectedSort, array $options, string $defaultSort): string {
    $sortKey = isset($options[$selectedSort]) ? $selectedSort : $defaultSort;
    return (string) ($options[$sortKey] ?? $options[$defaultSort] ?? 'Newest activity');
}

function build_crm_notice_class(?array $noticeMessage): string {
    if ($noticeMessage === null) {
        return 'admin-alert--success';
    }

    return ($noticeMessage['tone'] ?? 'success') === 'error' ? 'admin-alert--error' : 'admin-alert--success';
}