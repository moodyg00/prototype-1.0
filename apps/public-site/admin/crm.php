<?php

require_once __DIR__ . '/php/bootstrap.php';
require_once __DIR__ . '/php/features/crm-page.php';

$db = prepare_admin_page();
$error = null;
$notice = trim((string) ($_GET['notice'] ?? ''));
$activeModal = trim((string) ($_GET['modal'] ?? ''));
$selectedLeadId = trim((string) ($_GET['lead_id'] ?? $_GET['id'] ?? ''));
$selectedCustomerId = trim((string) ($_GET['customer_id'] ?? ''));
$selectedJobId = trim((string) ($_GET['job_id'] ?? ''));
$sourceLeadId = trim((string) ($_GET['from_lead_id'] ?? ''));
$newRecordType = trim((string) ($_GET['new'] ?? ''));

if (!in_array($activeModal, ['lead', 'customer', 'job'], true)) {
    $activeModal = '';
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    assert_valid_csrf_token($_POST['csrf_token'] ?? null);
    $action = trim((string) ($_POST['action'] ?? ''));

    try {
        if ($action === 'delete_lead') {
            $selectedLeadId = trim((string) ($_POST['id'] ?? ''));
            delete_lead_record($selectedLeadId);
            header('Location: ' . build_crm_return_url(['notice' => 'lead-deleted']));
            exit;
        }

        if ($action === 'save_lead') {
            $selectedLeadId = trim((string) ($_POST['id'] ?? ''));
            $savedLead = save_lead_record($_POST);
            header('Location: ' . build_crm_return_url([
                'lead_id' => (string) $savedLead['id'],
                'notice' => $selectedLeadId === '' ? 'lead-created' : 'lead-saved',
            ]));
            exit;
        }

        if ($action === 'book_lead') {
            $selectedLeadId = trim((string) ($_POST['id'] ?? ''));
            $bookedLead = update_lead_record_status($selectedLeadId, 'booked');
            header('Location: ' . build_crm_return_url([
                'lead_id' => (string) $bookedLead['id'],
                'notice' => 'lead-booked',
            ]));
            exit;
        }

        if ($action === 'archive_lead') {
            $selectedLeadId = trim((string) ($_POST['id'] ?? ''));
            $archivedLead = update_lead_record_status($selectedLeadId, 'archived');
            header('Location: ' . build_crm_return_url([
                'lead_id' => (string) $archivedLead['id'],
                'notice' => 'lead-archived',
            ]));
            exit;
        }

        if ($action === 'delete_customer') {
            $selectedCustomerId = trim((string) ($_POST['customer_id'] ?? ''));
            delete_customer_record($selectedCustomerId);
            header('Location: ' . build_crm_return_url(['notice' => 'customer-deleted']));
            exit;
        }

        if ($action === 'save_customer') {
            $selectedCustomerId = trim((string) ($_POST['customer_id'] ?? ''));
            $savedCustomer = save_customer_record($_POST);
            header('Location: ' . build_crm_return_url([
                'customer_id' => (string) $savedCustomer['id'],
                'notice' => $selectedCustomerId === '' ? 'customer-created' : 'customer-saved',
            ]));
            exit;
        }

        if ($action === 'archive_customer') {
            $selectedCustomerId = trim((string) ($_POST['customer_id'] ?? ''));
            $archivedCustomer = update_customer_record_status($selectedCustomerId, 'archived');
            header('Location: ' . build_crm_return_url([
                'customer_id' => (string) $archivedCustomer['id'],
                'notice' => 'customer-archived',
            ]));
            exit;
        }

        if ($action === 'restore_customer') {
            $selectedCustomerId = trim((string) ($_POST['customer_id'] ?? ''));
            $restoredCustomer = update_customer_record_status($selectedCustomerId, 'active');
            header('Location: ' . build_crm_return_url([
                'customer_id' => (string) $restoredCustomer['id'],
                'notice' => 'customer-restored',
            ]));
            exit;
        }

        if ($action === 'delete_job') {
            $selectedJobId = trim((string) ($_POST['job_id'] ?? ''));
            delete_job_record($selectedJobId);
            header('Location: ' . build_crm_return_url(['notice' => 'job-deleted']));
            exit;
        }

        if ($action === 'save_job') {
            $selectedJobId = trim((string) ($_POST['job_id'] ?? ''));
            $savedJob = save_job_record($_POST);
            header('Location: ' . build_crm_return_url([
                'job_id' => (string) $savedJob['id'],
                'notice' => $selectedJobId === '' ? 'job-created' : 'job-saved',
            ]));
            exit;
        }

        if ($action === 'complete_job') {
            $selectedJobId = trim((string) ($_POST['job_id'] ?? ''));
            $completedJob = update_job_record_status($selectedJobId, 'completed');
            header('Location: ' . build_crm_return_url([
                'job_id' => (string) $completedJob['id'],
                'notice' => 'job-completed',
            ]));
            exit;
        }

        if ($action === 'reopen_job') {
            $selectedJobId = trim((string) ($_POST['job_id'] ?? ''));
            $reopenedJob = update_job_record_status($selectedJobId, 'in-progress');
            header('Location: ' . build_crm_return_url([
                'job_id' => (string) $reopenedJob['id'],
                'notice' => 'job-reopened',
            ]));
            exit;
        }

        throw new InvalidArgumentException('Choose a valid CRM action.');
    } catch (Throwable $throwable) {
        $error = $throwable->getMessage();
    }
}

$leadRecords = get_lead_records();
$customerRecords = get_customer_records();
$jobRecords = get_job_records();
$crmFilters = read_crm_filters($_GET);

$filteredLeadRecords = filter_lead_records($leadRecords, $crmFilters);
$filteredCustomerRecords = filter_customer_records($customerRecords, $crmFilters);
$filteredJobRecords = filter_job_records($jobRecords, $crmFilters);

$isCreatingLead = $newRecordType === 'lead' || ($newRecordType === '1' && $activeModal === 'lead');
$isCreatingCustomer = $newRecordType === 'customer';
$isCreatingJob = $newRecordType === 'job';

if ($error !== null && $activeModal === '') {
    if (($action ?? '') === 'save_customer' || ($action ?? '') === 'delete_customer') {
        $activeModal = 'customer';
    } elseif (($action ?? '') === 'save_job' || ($action ?? '') === 'delete_job') {
        $activeModal = 'job';
    } else {
        $activeModal = 'lead';
    }
}

$selectedLead = resolve_selected_lead_record($selectedLeadId, $isCreatingLead, $error, $_POST);
$selectedCustomer = resolve_selected_customer_record($selectedCustomerId, $isCreatingCustomer, $error, $_POST);
$selectedJob = $sourceLeadId !== '' && $isCreatingJob && $error === null
    ? resolve_selected_job_record_from_lead($sourceLeadId)
    : resolve_selected_job_record($selectedJobId, $isCreatingJob, $error, $_POST);
$pageClassName = 'crm';
$noticeMessage = build_crm_notice_message($notice);
$crmSummary = count_leads_summary($leadRecords);
$customerSummary = count_customers_summary($customerRecords);
$jobSummary = count_jobs_summary($jobRecords);
$leadStatusOptions = get_crm_lead_status_options();
$leadSourceOptions = get_crm_lead_source_options();
$leadServiceOptions = get_crm_lead_service_options();
$leadSortOptions = get_crm_lead_sort_options();
$customerStatusOptions = get_crm_customer_status_options();
$customerSortOptions = get_crm_customer_sort_options();
$jobStatusOptions = get_crm_job_status_options();
$jobServiceOptions = get_crm_job_service_options();
$jobSortOptions = get_crm_job_sort_options();
$customerOptions = build_customer_option_map($customerRecords);
$leadOptions = build_lead_option_map($leadRecords);
$leadFilterChips = build_lead_filter_chips($crmFilters, $leadStatusOptions, $leadServiceOptions, $customerOptions);
$customerFilterChips = build_customer_filter_chips($crmFilters, $customerStatusOptions);
$jobFilterChips = build_job_filter_chips($crmFilters, $jobStatusOptions, $jobServiceOptions, $customerOptions);
$selectedCustomerLeadRecords = !empty($selectedCustomer['id']) ? get_customer_related_lead_records($leadRecords, (string) $selectedCustomer['id']) : [];
$selectedCustomerJobRecords = !empty($selectedCustomer['id']) ? get_customer_related_job_records($jobRecords, (string) $selectedCustomer['id']) : [];
$selectedJobDuplicateLeadCount = !empty($selectedJob['lead_id']) ? count(get_job_records_by_lead_id((string) $selectedJob['lead_id'], (string) ($selectedJob['id'] ?? ''))) : 0;
$selectedJobRelatedLeadJobs = !empty($selectedJob['lead_id']) ? get_job_records_by_lead_id((string) $selectedJob['lead_id'], (string) ($selectedJob['id'] ?? '')) : [];
$leadSortLabel = build_crm_sort_label((string) ($crmFilters['lead_sort'] ?? 'updated_desc'), $leadSortOptions, 'updated_desc');
$customerSortLabel = build_crm_sort_label((string) ($crmFilters['customer_sort'] ?? 'updated_desc'), $customerSortOptions, 'updated_desc');
$jobSortLabel = build_crm_sort_label((string) ($crmFilters['job_sort'] ?? 'updated_desc'), $jobSortOptions, 'updated_desc');
$noticeClassName = build_crm_notice_class($noticeMessage);

render_admin_page('crm', compact(
    'db',
    'error',
    'noticeMessage',
    'leadRecords',
    'customerRecords',
    'jobRecords',
    'filteredLeadRecords',
    'filteredCustomerRecords',
    'filteredJobRecords',
    'selectedLead',
    'selectedCustomer',
    'selectedJob',
    'selectedLeadId',
    'selectedCustomerId',
    'selectedJobId',
    'sourceLeadId',
    'activeModal',
    'crmSummary',
    'customerSummary',
    'jobSummary',
    'leadStatusOptions',
    'leadSourceOptions',
    'leadServiceOptions',
    'leadSortOptions',
    'customerStatusOptions',
    'customerSortOptions',
    'jobStatusOptions',
    'jobServiceOptions',
    'jobSortOptions',
    'customerOptions',
    'leadOptions',
    'crmFilters',
    'leadFilterChips',
    'customerFilterChips',
    'jobFilterChips',
    'selectedCustomerLeadRecords',
    'selectedCustomerJobRecords',
    'selectedJobDuplicateLeadCount',
    'selectedJobRelatedLeadJobs',
    'leadSortLabel',
    'customerSortLabel',
    'jobSortLabel',
    'noticeClassName',
    'pageClassName'
));