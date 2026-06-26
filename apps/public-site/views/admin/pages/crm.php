<?php
$isLeadModalOpen = $activeModal === 'lead';
$isCustomerModalOpen = $activeModal === 'customer';
$isJobModalOpen = $activeModal === 'job';
$closeModalHref = 'crm.php';
$leadHighlightId = trim((string) ($selectedLeadId ?? $selectedLead['id'] ?? ''));
$customerHighlightId = trim((string) ($selectedCustomerId ?? $selectedCustomer['id'] ?? ''));
$jobHighlightId = trim((string) ($selectedJobId ?? $selectedJob['id'] ?? ''));
?>
<main class="admin-main admin-main--crm">
    <div class="wrapper admin-wrapper">
        <section class="admin-page-hero card">
            <div class="admin-crm-hero__top">
                <div>
                    <p class="admin-page-eyebrow">CRM</p>
                    <h1>Pipeline Workspace</h1>
                    <p class="admin-page-intro">Leads, customer records, and active jobs now sit in one operating view. Tables stay minimal, and the details stay inside modals.</p>
                </div>
                <div class="admin-crm-toolbar">
                    <a class="btn" href="crm.php?new=lead&modal=lead">Add Lead</a>
                </div>
            </div>

            <div class="admin-stats-grid">
                <article class="admin-stat-card">
                    <span class="admin-stat-card__label">Total Leads</span>
                    <strong><?php echo (int) ($crmSummary['total'] ?? 0); ?></strong>
                </article>
                <article class="admin-stat-card">
                    <span class="admin-stat-card__label">Customers</span>
                    <strong><?php echo (int) ($customerSummary['total'] ?? 0); ?></strong>
                </article>
                <article class="admin-stat-card">
                    <span class="admin-stat-card__label">Open Jobs</span>
                    <strong><?php echo (int) ($jobSummary['total'] ?? 0); ?></strong>
                </article>
                <article class="admin-stat-card">
                    <span class="admin-stat-card__label">Booked Leads</span>
                    <strong><?php echo (int) ($crmSummary['booked'] ?? 0); ?></strong>
                </article>
            </div>
        </section>

        <?php if ($noticeMessage !== null): ?>
            <section class="admin-alert admin-alert--toast <?php echo htmlspecialchars((string) ($noticeClassName ?? 'admin-alert--success'), ENT_QUOTES, 'UTF-8'); ?>" aria-live="polite"><?php echo htmlspecialchars((string) ($noticeMessage['message'] ?? ''), ENT_QUOTES, 'UTF-8'); ?></section>
        <?php endif; ?>

        <?php if ($error !== null): ?>
            <section class="admin-alert admin-alert--error" aria-live="assertive"><?php echo htmlspecialchars($error, ENT_QUOTES, 'UTF-8'); ?></section>
        <?php endif; ?>

        <div class="admin-crm-sections">
            <section id="crm-leads" class="card admin-crm-table-card admin-crm-table-card--wide">
                <div class="admin-section-heading admin-section-heading--table">
                    <div>
                        <p class="admin-page-eyebrow">Pipeline</p>
                        <h2>Open Leads</h2>
                        <p class="admin-section-caption">Status, service, and linked customer stay visible on the row. Follow-up history lives in the lead modal.</p>
                    </div>
                    <a class="btn" href="crm.php?new=lead&modal=lead">Add Lead</a>
                </div>

                <details class="admin-crm-refine"<?php echo !empty($leadFilterChips) ? ' open' : ''; ?>>
                    <summary class="admin-crm-refine__summary">Refine Leads</summary>
                    <form class="admin-crm-filters" method="get">
                        <label>
                            <span>Lead status</span>
                            <select name="lead_status">
                                <option value="">All statuses</option>
                                <?php foreach ($leadStatusOptions as $statusValue => $statusLabel): ?>
                                    <option value="<?php echo htmlspecialchars($statusValue, ENT_QUOTES, 'UTF-8'); ?>"<?php echo ($crmFilters['lead_status'] ?? '') === $statusValue ? ' selected' : ''; ?>><?php echo htmlspecialchars($statusLabel, ENT_QUOTES, 'UTF-8'); ?></option>
                                <?php endforeach; ?>
                            </select>
                        </label>
                        <label>
                            <span>Service</span>
                            <select name="lead_service_key">
                                <option value="">All services</option>
                                <?php foreach ($leadServiceOptions as $serviceValue => $serviceLabel): ?>
                                    <?php if ($serviceValue === '') { continue; } ?>
                                    <option value="<?php echo htmlspecialchars($serviceValue, ENT_QUOTES, 'UTF-8'); ?>"<?php echo ($crmFilters['lead_service_key'] ?? '') === $serviceValue ? ' selected' : ''; ?>><?php echo htmlspecialchars($serviceLabel, ENT_QUOTES, 'UTF-8'); ?></option>
                                <?php endforeach; ?>
                            </select>
                        </label>
                        <label>
                            <span>Customer</span>
                            <select name="lead_customer_id">
                                <?php foreach ($customerOptions as $customerValue => $customerLabel): ?>
                                    <option value="<?php echo htmlspecialchars($customerValue, ENT_QUOTES, 'UTF-8'); ?>"<?php echo ($crmFilters['lead_customer_id'] ?? '') === $customerValue ? ' selected' : ''; ?>><?php echo htmlspecialchars($customerLabel, ENT_QUOTES, 'UTF-8'); ?></option>
                                <?php endforeach; ?>
                            </select>
                        </label>
                        <label>
                            <span>Sort</span>
                            <select name="lead_sort">
                                <?php foreach ($leadSortOptions as $sortValue => $sortLabel): ?>
                                    <option value="<?php echo htmlspecialchars($sortValue, ENT_QUOTES, 'UTF-8'); ?>"<?php echo ($crmFilters['lead_sort'] ?? 'updated_desc') === $sortValue ? ' selected' : ''; ?>><?php echo htmlspecialchars($sortLabel, ENT_QUOTES, 'UTF-8'); ?></option>
                                <?php endforeach; ?>
                            </select>
                        </label>
                        <div class="admin-crm-filters__actions">
                            <button class="btn btn--secondary" type="submit">Apply</button>
                            <a class="btn btn--ghost" href="crm.php#crm-leads">Clear</a>
                        </div>
                    </form>
                </details>

                <?php if (!empty($leadFilterChips)): ?>
                    <div class="admin-crm-chip-row" aria-label="Active lead filters">
                        <?php foreach ($leadFilterChips as $chip): ?>
                            <a class="admin-crm-chip" href="<?php echo htmlspecialchars((string) ($chip['href'] ?? 'crm.php#crm-leads'), ENT_QUOTES, 'UTF-8'); ?>"><?php echo htmlspecialchars((string) ($chip['label'] ?? ''), ENT_QUOTES, 'UTF-8'); ?> ×</a>
                        <?php endforeach; ?>
                    </div>
                <?php endif; ?>

                <p class="admin-crm-sort-note">Sorted by: <?php echo htmlspecialchars((string) ($leadSortLabel ?? 'Newest activity'), ENT_QUOTES, 'UTF-8'); ?></p>

                <div class="admin-crm-search-shell">
                    <input class="admin-crm-search-input" type="search" placeholder="start typing...." data-crm-search-input="leads" autocomplete="off" spellcheck="false">
                </div>

                <div class="admin-table-shell">
                    <table class="admin-data-table crm-data-table" data-crm-search-table="leads">
                        <thead>
                            <tr>
                                <th>Lead</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($filteredLeadRecords as $record): ?>
                                <?php $isSelected = $leadHighlightId !== '' && $leadHighlightId === (string) ($record['id'] ?? ''); ?>
                                <?php $serviceLabel = $leadServiceOptions[(string) ($record['service_key'] ?? '')] ?? 'General Inquiry'; ?>
                                <?php $sourceLabel = $leadSourceOptions[(string) ($record['source'] ?? 'website')] ?? 'Website'; ?>
                                <?php $customerLabel = $customerOptions[(string) ($record['customer_id'] ?? '')] ?? ''; ?>
                                <?php $leadSearchIndex = strtolower(implode(' ', array_filter([
                                    (string) ($record['name'] ?? ''),
                                    (string) ($record['status'] ?? ''),
                                    (string) ($record['service_key'] ?? ''),
                                    (string) $serviceLabel,
                                    (string) ($record['customer_id'] ?? ''),
                                    (string) $customerLabel,
                                    (string) ($record['phone'] ?? ''),
                                    (string) ($record['source'] ?? ''),
                                    (string) $sourceLabel,
                                    (string) ($record['location'] ?? ''),
                                ]))); ?>
                                <tr class="crm-data-table__row<?php echo $isSelected ? ' is-selected' : ''; ?>" data-crm-search-row data-crm-row-link="crm.php?lead_id=<?php echo urlencode((string) ($record['id'] ?? '')); ?>&modal=lead" data-crm-search-index="<?php echo htmlspecialchars($leadSearchIndex, ENT_QUOTES, 'UTF-8'); ?>" role="link" tabindex="0">
                                    <td>
                                        <div class="admin-crm-row__content">
                                            <div class="admin-crm-row__main">
                                                <div class="admin-crm-row__badges">
                                                    <span class="admin-badge admin-badge--small admin-badge--status-<?php echo htmlspecialchars((string) ($record['status'] ?? 'new'), ENT_QUOTES, 'UTF-8'); ?>"><?php echo htmlspecialchars($leadStatusOptions[(string) ($record['status'] ?? 'new')] ?? 'New', ENT_QUOTES, 'UTF-8'); ?></span>
                                                    <?php if ((string) ($record['service_key'] ?? '') !== ''): ?>
                                                        <span class="admin-badge admin-badge--small admin-badge--accent"><?php echo htmlspecialchars($serviceLabel, ENT_QUOTES, 'UTF-8'); ?></span>
                                                    <?php endif; ?>
                                                    <?php if ((string) ($record['customer_id'] ?? '') !== '' && $customerLabel !== ''): ?>
                                                        <span class="admin-badge admin-badge--small admin-badge--neutral"><?php echo htmlspecialchars($customerLabel, ENT_QUOTES, 'UTF-8'); ?></span>
                                                    <?php endif; ?>
                                                </div>
                                                <strong class="admin-crm-row__name"><?php echo htmlspecialchars((string) ($record['name'] ?? ''), ENT_QUOTES, 'UTF-8'); ?></strong>
                                                <span class="admin-crm-row__meta">phone: <?php echo htmlspecialchars((string) ($record['phone'] ?? 'not set'), ENT_QUOTES, 'UTF-8'); ?> · source: <?php echo htmlspecialchars($sourceLabel, ENT_QUOTES, 'UTF-8'); ?><?php if (!empty($record['location'])): ?> · area: <?php echo htmlspecialchars((string) $record['location'], ENT_QUOTES, 'UTF-8'); ?><?php endif; ?> · activity: <?php echo count($record['activity'] ?? []); ?></span>
                                            </div>
                                            <div class="admin-crm-row__actions">
                                                <div class="admin-table-action-stack">
                                                    <a class="btn btn--secondary admin-table-action" href="crm.php?lead_id=<?php echo urlencode((string) ($record['id'] ?? '')); ?>&modal=lead">Edit</a>
                                                    <?php if (($record['status'] ?? '') !== 'booked' && ($record['status'] ?? '') !== 'archived'): ?>
                                                        <form method="post" class="admin-inline-action-form">
                                                            <input type="hidden" name="csrf_token" value="<?php echo htmlspecialchars((string) ($_SESSION['csrf_token'] ?? ''), ENT_QUOTES, 'UTF-8'); ?>">
                                                            <input type="hidden" name="id" value="<?php echo htmlspecialchars((string) ($record['id'] ?? ''), ENT_QUOTES, 'UTF-8'); ?>">
                                                            <button type="submit" class="btn btn--ghost admin-table-action" name="action" value="book_lead">Book</button>
                                                        </form>
                                                    <?php endif; ?>
                                                    <?php if (($record['status'] ?? '') !== 'archived'): ?>
                                                        <form method="post" class="admin-inline-action-form">
                                                            <input type="hidden" name="csrf_token" value="<?php echo htmlspecialchars((string) ($_SESSION['csrf_token'] ?? ''), ENT_QUOTES, 'UTF-8'); ?>">
                                                            <input type="hidden" name="id" value="<?php echo htmlspecialchars((string) ($record['id'] ?? ''), ENT_QUOTES, 'UTF-8'); ?>">
                                                            <button type="submit" class="btn btn--ghost admin-table-action" name="action" value="archive_lead">Archive</button>
                                                        </form>
                                                    <?php endif; ?>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            <?php endforeach; ?>
                            <?php if (empty($filteredLeadRecords)): ?>
                                <tr>
                                    <td class="admin-crm-empty-state">No leads match the current filters.</td>
                                </tr>
                            <?php endif; ?>
                            <tr<?php echo empty($filteredLeadRecords) ? ' hidden' : ''; ?> data-crm-empty-row>
                                <td class="admin-crm-empty-state">No leads match the current search.</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>

            <section id="crm-customers" class="card admin-crm-table-card">
                <div class="admin-section-heading admin-section-heading--table">
                    <div>
                        <p class="admin-page-eyebrow">People</p>
                        <h2>Customers</h2>
                        <p class="admin-section-caption">Customer records hold the reusable contact layer once leads turn into repeat work.</p>
                    </div>
                    <a class="btn" href="crm.php?new=customer&modal=customer">Add Customer</a>
                </div>

                <details class="admin-crm-refine"<?php echo !empty($customerFilterChips) ? ' open' : ''; ?>>
                    <summary class="admin-crm-refine__summary">Refine Customers</summary>
                    <form class="admin-crm-filters" method="get">
                        <label>
                            <span>Customer status</span>
                            <select name="customer_status">
                                <option value="">All statuses</option>
                                <?php foreach ($customerStatusOptions as $statusValue => $statusLabel): ?>
                                    <option value="<?php echo htmlspecialchars($statusValue, ENT_QUOTES, 'UTF-8'); ?>"<?php echo ($crmFilters['customer_status'] ?? '') === $statusValue ? ' selected' : ''; ?>><?php echo htmlspecialchars($statusLabel, ENT_QUOTES, 'UTF-8'); ?></option>
                                <?php endforeach; ?>
                            </select>
                        </label>
                        <label>
                            <span>Sort</span>
                            <select name="customer_sort">
                                <?php foreach ($customerSortOptions as $sortValue => $sortLabel): ?>
                                    <option value="<?php echo htmlspecialchars($sortValue, ENT_QUOTES, 'UTF-8'); ?>"<?php echo ($crmFilters['customer_sort'] ?? 'updated_desc') === $sortValue ? ' selected' : ''; ?>><?php echo htmlspecialchars($sortLabel, ENT_QUOTES, 'UTF-8'); ?></option>
                                <?php endforeach; ?>
                            </select>
                        </label>
                        <div class="admin-crm-filters__actions">
                            <button class="btn btn--secondary" type="submit">Apply</button>
                            <a class="btn btn--ghost" href="crm.php#crm-customers">Clear</a>
                        </div>
                    </form>
                </details>

                <?php if (!empty($customerFilterChips)): ?>
                    <div class="admin-crm-chip-row" aria-label="Active customer filters">
                        <?php foreach ($customerFilterChips as $chip): ?>
                            <a class="admin-crm-chip" href="<?php echo htmlspecialchars((string) ($chip['href'] ?? 'crm.php#crm-customers'), ENT_QUOTES, 'UTF-8'); ?>"><?php echo htmlspecialchars((string) ($chip['label'] ?? ''), ENT_QUOTES, 'UTF-8'); ?> ×</a>
                        <?php endforeach; ?>
                    </div>
                <?php endif; ?>

                <p class="admin-crm-sort-note">Sorted by: <?php echo htmlspecialchars((string) ($customerSortLabel ?? 'Newest activity'), ENT_QUOTES, 'UTF-8'); ?></p>

                <div class="admin-crm-search-shell">
                    <input class="admin-crm-search-input" type="search" placeholder="start typing...." data-crm-search-input="customers" autocomplete="off" spellcheck="false">
                </div>

                <div class="admin-table-shell">
                    <table class="admin-data-table crm-data-table" data-crm-search-table="customers">
                        <thead>
                            <tr>
                                <th>Customer</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($filteredCustomerRecords as $record): ?>
                                <?php $isSelected = $customerHighlightId !== '' && $customerHighlightId === (string) ($record['id'] ?? ''); ?>
                                <?php $relatedLeadCount = count_customer_related_leads($leadRecords, (string) ($record['id'] ?? '')); ?>
                                <?php $relatedJobCount = count_customer_related_jobs($jobRecords, (string) ($record['id'] ?? '')); ?>
                                <?php $customerSearchIndex = strtolower(implode(' ', array_filter([
                                    (string) ($record['name'] ?? ''),
                                    (string) ($record['status'] ?? ''),
                                    (string) ($record['phone'] ?? ''),
                                    (string) ($record['email'] ?? ''),
                                    (string) ($record['location'] ?? ''),
                                ]))); ?>
                                <tr class="crm-data-table__row<?php echo $isSelected ? ' is-selected' : ''; ?>" data-crm-search-row data-crm-row-link="crm.php?customer_id=<?php echo urlencode((string) ($record['id'] ?? '')); ?>&modal=customer" data-crm-search-index="<?php echo htmlspecialchars($customerSearchIndex, ENT_QUOTES, 'UTF-8'); ?>" role="link" tabindex="0">
                                    <td>
                                        <div class="admin-crm-row__content">
                                            <div class="admin-crm-row__main">
                                                <div class="admin-crm-row__badges">
                                                    <span class="admin-badge admin-badge--small admin-badge--status-<?php echo htmlspecialchars((string) ($record['status'] ?? 'prospect'), ENT_QUOTES, 'UTF-8'); ?>"><?php echo htmlspecialchars($customerStatusOptions[(string) ($record['status'] ?? 'prospect')] ?? 'Prospect', ENT_QUOTES, 'UTF-8'); ?></span>
                                                </div>
                                                <strong class="admin-crm-row__name"><?php echo htmlspecialchars((string) ($record['name'] ?? ''), ENT_QUOTES, 'UTF-8'); ?></strong>
                                                <span class="admin-crm-row__meta">phone: <?php echo htmlspecialchars((string) ($record['phone'] ?? 'not set'), ENT_QUOTES, 'UTF-8'); ?><?php if (!empty($record['email'])): ?> · email: <?php echo htmlspecialchars((string) $record['email'], ENT_QUOTES, 'UTF-8'); ?><?php endif; ?><?php if (!empty($record['location'])): ?> · area: <?php echo htmlspecialchars((string) $record['location'], ENT_QUOTES, 'UTF-8'); ?><?php endif; ?></span>
                                                <span class="admin-crm-row__links"><a href="crm.php?lead_customer_id=<?php echo urlencode((string) ($record['id'] ?? '')); ?>#crm-leads"><?php echo (int) $relatedLeadCount; ?> leads</a> · <a href="crm.php?job_customer_id=<?php echo urlencode((string) ($record['id'] ?? '')); ?>#crm-jobs"><?php echo (int) $relatedJobCount; ?> jobs</a></span>
                                            </div>
                                            <div class="admin-crm-row__actions">
                                                <div class="admin-table-action-stack">
                                                    <a class="btn btn--secondary admin-table-action" href="crm.php?customer_id=<?php echo urlencode((string) ($record['id'] ?? '')); ?>&modal=customer">Edit</a>
                                                    <?php if (($record['status'] ?? '') !== 'archived'): ?>
                                                        <form method="post" class="admin-inline-action-form">
                                                            <input type="hidden" name="csrf_token" value="<?php echo htmlspecialchars((string) ($_SESSION['csrf_token'] ?? ''), ENT_QUOTES, 'UTF-8'); ?>">
                                                            <input type="hidden" name="customer_id" value="<?php echo htmlspecialchars((string) ($record['id'] ?? ''), ENT_QUOTES, 'UTF-8'); ?>">
                                                            <button type="submit" class="btn btn--ghost admin-table-action" name="action" value="archive_customer">Archive</button>
                                                        </form>
                                                    <?php else: ?>
                                                        <form method="post" class="admin-inline-action-form">
                                                            <input type="hidden" name="csrf_token" value="<?php echo htmlspecialchars((string) ($_SESSION['csrf_token'] ?? ''), ENT_QUOTES, 'UTF-8'); ?>">
                                                            <input type="hidden" name="customer_id" value="<?php echo htmlspecialchars((string) ($record['id'] ?? ''), ENT_QUOTES, 'UTF-8'); ?>">
                                                            <button type="submit" class="btn btn--ghost admin-table-action" name="action" value="restore_customer">Restore</button>
                                                        </form>
                                                    <?php endif; ?>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            <?php endforeach; ?>
                            <?php if (empty($filteredCustomerRecords)): ?>
                                <tr>
                                    <td class="admin-crm-empty-state">No customers match the current filters.</td>
                                </tr>
                            <?php endif; ?>
                            <tr<?php echo empty($filteredCustomerRecords) ? ' hidden' : ''; ?> data-crm-empty-row>
                                <td class="admin-crm-empty-state">No customers match the current search.</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>

            <section id="crm-jobs" class="card admin-crm-table-card">
                <div class="admin-section-heading admin-section-heading--table">
                    <div>
                        <p class="admin-page-eyebrow">Work Orders</p>
                        <h2>Jobs</h2>
                        <p class="admin-section-caption">Booked work moves here with a customer, lead, and schedule tied together.</p>
                    </div>
                    <a class="btn" href="crm.php?new=job&modal=job">Add Job</a>
                </div>

                <details class="admin-crm-refine"<?php echo !empty($jobFilterChips) ? ' open' : ''; ?>>
                    <summary class="admin-crm-refine__summary">Refine Jobs</summary>
                    <form class="admin-crm-filters" method="get">
                        <label>
                            <span>Job status</span>
                            <select name="job_status">
                                <option value="">All statuses</option>
                                <?php foreach ($jobStatusOptions as $statusValue => $statusLabel): ?>
                                    <option value="<?php echo htmlspecialchars($statusValue, ENT_QUOTES, 'UTF-8'); ?>"<?php echo ($crmFilters['job_status'] ?? '') === $statusValue ? ' selected' : ''; ?>><?php echo htmlspecialchars($statusLabel, ENT_QUOTES, 'UTF-8'); ?></option>
                                <?php endforeach; ?>
                            </select>
                        </label>
                        <label>
                            <span>Service</span>
                            <select name="job_service_key">
                                <option value="">All services</option>
                                <?php foreach ($jobServiceOptions as $serviceValue => $serviceLabel): ?>
                                    <?php if ($serviceValue === '') { continue; } ?>
                                    <option value="<?php echo htmlspecialchars($serviceValue, ENT_QUOTES, 'UTF-8'); ?>"<?php echo ($crmFilters['job_service_key'] ?? '') === $serviceValue ? ' selected' : ''; ?>><?php echo htmlspecialchars($serviceLabel, ENT_QUOTES, 'UTF-8'); ?></option>
                                <?php endforeach; ?>
                            </select>
                        </label>
                        <label>
                            <span>Customer</span>
                            <select name="job_customer_id">
                                <?php foreach ($customerOptions as $customerValue => $customerLabel): ?>
                                    <option value="<?php echo htmlspecialchars($customerValue, ENT_QUOTES, 'UTF-8'); ?>"<?php echo ($crmFilters['job_customer_id'] ?? '') === $customerValue ? ' selected' : ''; ?>><?php echo htmlspecialchars($customerLabel, ENT_QUOTES, 'UTF-8'); ?></option>
                                <?php endforeach; ?>
                            </select>
                        </label>
                        <label>
                            <span>Sort</span>
                            <select name="job_sort">
                                <?php foreach ($jobSortOptions as $sortValue => $sortLabel): ?>
                                    <option value="<?php echo htmlspecialchars($sortValue, ENT_QUOTES, 'UTF-8'); ?>"<?php echo ($crmFilters['job_sort'] ?? 'updated_desc') === $sortValue ? ' selected' : ''; ?>><?php echo htmlspecialchars($sortLabel, ENT_QUOTES, 'UTF-8'); ?></option>
                                <?php endforeach; ?>
                            </select>
                        </label>
                        <div class="admin-crm-filters__actions">
                            <button class="btn btn--secondary" type="submit">Apply</button>
                            <a class="btn btn--ghost" href="crm.php#crm-jobs">Clear</a>
                        </div>
                    </form>
                </details>

                <?php if (!empty($jobFilterChips)): ?>
                    <div class="admin-crm-chip-row" aria-label="Active job filters">
                        <?php foreach ($jobFilterChips as $chip): ?>
                            <a class="admin-crm-chip" href="<?php echo htmlspecialchars((string) ($chip['href'] ?? 'crm.php#crm-jobs'), ENT_QUOTES, 'UTF-8'); ?>"><?php echo htmlspecialchars((string) ($chip['label'] ?? ''), ENT_QUOTES, 'UTF-8'); ?> ×</a>
                        <?php endforeach; ?>
                    </div>
                <?php endif; ?>

                <p class="admin-crm-sort-note">Sorted by: <?php echo htmlspecialchars((string) ($jobSortLabel ?? 'Newest activity'), ENT_QUOTES, 'UTF-8'); ?></p>

                <div class="admin-crm-search-shell">
                    <input class="admin-crm-search-input" type="search" placeholder="start typing...." data-crm-search-input="jobs" autocomplete="off" spellcheck="false">
                </div>

                <div class="admin-table-shell">
                    <table class="admin-data-table crm-data-table" data-crm-search-table="jobs">
                        <thead>
                            <tr>
                                <th>Job</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($filteredJobRecords as $record): ?>
                                <?php $isSelected = $jobHighlightId !== '' && $jobHighlightId === (string) ($record['id'] ?? ''); ?>
                                <?php $serviceLabel = $jobServiceOptions[(string) ($record['service_key'] ?? '')] ?? 'General Handyman'; ?>
                                <?php $customerLabel = $customerOptions[(string) ($record['customer_id'] ?? '')] ?? 'No customer linked'; ?>
                                <?php $leadLabel = $leadOptions[(string) ($record['lead_id'] ?? '')] ?? 'No lead linked'; ?>
                                <?php $jobSearchIndex = strtolower(implode(' ', array_filter([
                                    (string) ($record['title'] ?? ''),
                                    (string) ($record['status'] ?? ''),
                                    (string) ($record['service_key'] ?? ''),
                                    (string) $serviceLabel,
                                    (string) ($record['customer_id'] ?? ''),
                                    (string) $customerLabel,
                                    (string) ($record['lead_id'] ?? ''),
                                    (string) $leadLabel,
                                    (string) ($record['scheduled_for'] ?? ''),
                                    (string) ($record['location'] ?? ''),
                                ]))); ?>
                                <tr class="crm-data-table__row<?php echo $isSelected ? ' is-selected' : ''; ?>" data-crm-search-row data-crm-row-link="crm.php?job_id=<?php echo urlencode((string) ($record['id'] ?? '')); ?>&modal=job" data-crm-search-index="<?php echo htmlspecialchars($jobSearchIndex, ENT_QUOTES, 'UTF-8'); ?>" role="link" tabindex="0">
                                    <td>
                                        <div class="admin-crm-row__content">
                                            <div class="admin-crm-row__main">
                                                <div class="admin-crm-row__badges">
                                                    <span class="admin-badge admin-badge--small admin-badge--status-<?php echo htmlspecialchars((string) ($record['status'] ?? 'scheduled'), ENT_QUOTES, 'UTF-8'); ?>"><?php echo htmlspecialchars($jobStatusOptions[(string) ($record['status'] ?? 'scheduled')] ?? 'Scheduled', ENT_QUOTES, 'UTF-8'); ?></span>
                                                    <?php if ((string) ($record['service_key'] ?? '') !== ''): ?>
                                                        <span class="admin-badge admin-badge--small admin-badge--accent"><?php echo htmlspecialchars($serviceLabel, ENT_QUOTES, 'UTF-8'); ?></span>
                                                    <?php endif; ?>
                                                </div>
                                                <strong class="admin-crm-row__name"><?php echo htmlspecialchars((string) ($record['title'] ?? ''), ENT_QUOTES, 'UTF-8'); ?></strong>
                                                <span class="admin-crm-row__meta">customer: <?php echo htmlspecialchars($customerLabel, ENT_QUOTES, 'UTF-8'); ?> · lead: <?php echo htmlspecialchars($leadLabel, ENT_QUOTES, 'UTF-8'); ?><?php if (!empty($record['scheduled_for'])): ?> · scheduled: <?php echo htmlspecialchars(str_replace('T', ' ', (string) $record['scheduled_for']), ENT_QUOTES, 'UTF-8'); ?><?php endif; ?></span>
                                            </div>
                                            <div class="admin-crm-row__actions">
                                                <div class="admin-table-action-stack">
                                                    <a class="btn btn--secondary admin-table-action" href="crm.php?job_id=<?php echo urlencode((string) ($record['id'] ?? '')); ?>&modal=job">Edit</a>
                                                    <?php if (($record['status'] ?? '') !== 'completed'): ?>
                                                        <form method="post" class="admin-inline-action-form">
                                                            <input type="hidden" name="csrf_token" value="<?php echo htmlspecialchars((string) ($_SESSION['csrf_token'] ?? ''), ENT_QUOTES, 'UTF-8'); ?>">
                                                            <input type="hidden" name="job_id" value="<?php echo htmlspecialchars((string) ($record['id'] ?? ''), ENT_QUOTES, 'UTF-8'); ?>">
                                                            <button type="submit" class="btn btn--ghost admin-table-action" name="action" value="complete_job">Complete</button>
                                                        </form>
                                                    <?php else: ?>
                                                        <form method="post" class="admin-inline-action-form">
                                                            <input type="hidden" name="csrf_token" value="<?php echo htmlspecialchars((string) ($_SESSION['csrf_token'] ?? ''), ENT_QUOTES, 'UTF-8'); ?>">
                                                            <input type="hidden" name="job_id" value="<?php echo htmlspecialchars((string) ($record['id'] ?? ''), ENT_QUOTES, 'UTF-8'); ?>">
                                                            <button type="submit" class="btn btn--ghost admin-table-action" name="action" value="reopen_job">Reopen</button>
                                                        </form>
                                                    <?php endif; ?>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            <?php endforeach; ?>
                            <?php if (empty($filteredJobRecords)): ?>
                                <tr>
                                    <td class="admin-crm-empty-state">No jobs match the current filters.</td>
                                </tr>
                            <?php endif; ?>
                            <tr<?php echo empty($filteredJobRecords) ? ' hidden' : ''; ?> data-crm-empty-row>
                                <td class="admin-crm-empty-state">No jobs match the current search.</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    </div>

    <section class="admin-modal" data-admin-modal="lead"<?php echo $isLeadModalOpen ? '' : ' hidden'; ?>>
        <div class="admin-modal__backdrop" data-modal-close></div>
        <div class="admin-modal__dialog card" role="dialog" aria-modal="true" aria-labelledby="leadEditorTitle">
            <div class="admin-modal__header">
                <div>
                    <p class="admin-page-eyebrow">Lead Editor</p>
                    <h2 id="leadEditorTitle"><?php echo !empty($selectedLead['id']) ? 'Edit Lead' : 'Add Lead'; ?></h2>
                </div>
                <a class="admin-modal__close" href="<?php echo htmlspecialchars($closeModalHref, ENT_QUOTES, 'UTF-8'); ?>" data-modal-close aria-label="Close lead editor">X</a>
            </div>

            <form method="post" class="admin-form admin-form--stacked admin-modal__body">
                <input type="hidden" name="csrf_token" value="<?php echo htmlspecialchars((string) ($_SESSION['csrf_token'] ?? ''), ENT_QUOTES, 'UTF-8'); ?>">
                <input type="hidden" name="id" value="<?php echo htmlspecialchars((string) ($selectedLead['id'] ?? ''), ENT_QUOTES, 'UTF-8'); ?>">
                <input type="hidden" name="action" value="save_lead">

                <div class="admin-form-grid">
                    <label>
                        <span>Lead name</span>
                        <input type="text" name="name" value="<?php echo htmlspecialchars((string) ($selectedLead['name'] ?? ''), ENT_QUOTES, 'UTF-8'); ?>" required>
                    </label>

                    <label>
                        <span>Status</span>
                        <select name="status">
                            <?php foreach ($leadStatusOptions as $statusValue => $statusLabel): ?>
                                <option value="<?php echo htmlspecialchars($statusValue, ENT_QUOTES, 'UTF-8'); ?>"<?php echo ($selectedLead['status'] ?? 'new') === $statusValue ? ' selected' : ''; ?>><?php echo htmlspecialchars($statusLabel, ENT_QUOTES, 'UTF-8'); ?></option>
                            <?php endforeach; ?>
                        </select>
                    </label>

                    <label>
                        <span>Service</span>
                        <select name="service_key">
                            <?php foreach ($leadServiceOptions as $serviceValue => $serviceLabel): ?>
                                <option value="<?php echo htmlspecialchars($serviceValue, ENT_QUOTES, 'UTF-8'); ?>"<?php echo ($selectedLead['service_key'] ?? '') === $serviceValue ? ' selected' : ''; ?>><?php echo htmlspecialchars($serviceLabel, ENT_QUOTES, 'UTF-8'); ?></option>
                            <?php endforeach; ?>
                        </select>
                    </label>

                    <label>
                        <span>Customer</span>
                        <select name="customer_id">
                            <?php foreach ($customerOptions as $customerValue => $customerLabel): ?>
                                <option value="<?php echo htmlspecialchars($customerValue, ENT_QUOTES, 'UTF-8'); ?>"<?php echo ($selectedLead['customer_id'] ?? '') === $customerValue ? ' selected' : ''; ?>><?php echo htmlspecialchars($customerLabel, ENT_QUOTES, 'UTF-8'); ?></option>
                            <?php endforeach; ?>
                        </select>
                    </label>

                    <label>
                        <span>Source</span>
                        <select name="source">
                            <?php foreach ($leadSourceOptions as $sourceValue => $sourceLabel): ?>
                                <option value="<?php echo htmlspecialchars($sourceValue, ENT_QUOTES, 'UTF-8'); ?>"<?php echo ($selectedLead['source'] ?? 'website') === $sourceValue ? ' selected' : ''; ?>><?php echo htmlspecialchars($sourceLabel, ENT_QUOTES, 'UTF-8'); ?></option>
                            <?php endforeach; ?>
                        </select>
                    </label>

                    <label>
                        <span>Phone</span>
                        <input type="text" name="phone" value="<?php echo htmlspecialchars((string) ($selectedLead['phone'] ?? ''), ENT_QUOTES, 'UTF-8'); ?>">
                    </label>

                    <label>
                        <span>Area / location</span>
                        <input type="text" name="location" value="<?php echo htmlspecialchars((string) ($selectedLead['location'] ?? ''), ENT_QUOTES, 'UTF-8'); ?>">
                    </label>

                    <label class="admin-form-grid__full">
                        <span>Notes</span>
                        <textarea name="notes" rows="6"><?php echo htmlspecialchars((string) ($selectedLead['notes'] ?? ''), ENT_QUOTES, 'UTF-8'); ?></textarea>
                    </label>

                    <label class="admin-form-grid__full">
                        <span>Add follow-up note</span>
                        <textarea name="activity_note" rows="3" placeholder="Log the latest call, text, quote update, or visit note."><?php echo htmlspecialchars((string) ($selectedLead['activity_note'] ?? ''), ENT_QUOTES, 'UTF-8'); ?></textarea>
                    </label>
                </div>

                <?php if (!empty($selectedLead['activity'])): ?>
                    <div class="admin-crm-activity">
                        <div class="admin-crm-activity__heading">
                            <p class="admin-page-eyebrow">History</p>
                            <h3>Lead Activity</h3>
                        </div>
                        <ul class="admin-crm-activity__list">
                            <?php foreach (array_reverse($selectedLead['activity']) as $activityEntry): ?>
                                <li class="admin-crm-activity__item">
                                    <span class="admin-crm-activity__meta"><?php echo htmlspecialchars((string) ($activityEntry['created_at'] ?? ''), ENT_QUOTES, 'UTF-8'); ?> · <?php echo htmlspecialchars(ucfirst((string) ($activityEntry['type'] ?? 'manual')), ENT_QUOTES, 'UTF-8'); ?></span>
                                    <strong><?php echo htmlspecialchars((string) ($activityEntry['message'] ?? ''), ENT_QUOTES, 'UTF-8'); ?></strong>
                                </li>
                            <?php endforeach; ?>
                        </ul>
                    </div>
                <?php endif; ?>

                <div class="admin-modal__footer">
                    <div class="admin-form-actions">
                        <button type="submit" class="btn">Save Lead</button>
                        <?php if (!empty($selectedLead['id']) && ($selectedLead['status'] ?? '') === 'booked'): ?>
                            <a class="btn btn--secondary" href="crm.php?new=job&modal=job&from_lead_id=<?php echo urlencode((string) ($selectedLead['id'] ?? '')); ?>">Create Job</a>
                        <?php endif; ?>
                        <?php if (!empty($selectedLead['id'])): ?>
                            <button type="submit" class="btn btn--danger" name="action" value="delete_lead" onclick="return confirm('Delete this lead?');">Delete</button>
                        <?php endif; ?>
                    </div>
                </div>
            </form>
        </div>
    </section>

    <section class="admin-modal" data-admin-modal="customer"<?php echo $isCustomerModalOpen ? '' : ' hidden'; ?>>
        <div class="admin-modal__backdrop" data-modal-close></div>
        <div class="admin-modal__dialog card" role="dialog" aria-modal="true" aria-labelledby="customerEditorTitle">
            <div class="admin-modal__header">
                <div>
                    <p class="admin-page-eyebrow">Customer Editor</p>
                    <h2 id="customerEditorTitle"><?php echo !empty($selectedCustomer['id']) ? 'Edit Customer' : 'Add Customer'; ?></h2>
                </div>
                <a class="admin-modal__close" href="<?php echo htmlspecialchars($closeModalHref, ENT_QUOTES, 'UTF-8'); ?>" data-modal-close aria-label="Close customer editor">X</a>
            </div>

            <form method="post" class="admin-form admin-form--stacked admin-modal__body">
                <input type="hidden" name="csrf_token" value="<?php echo htmlspecialchars((string) ($_SESSION['csrf_token'] ?? ''), ENT_QUOTES, 'UTF-8'); ?>">
                <input type="hidden" name="customer_id" value="<?php echo htmlspecialchars((string) ($selectedCustomer['id'] ?? ''), ENT_QUOTES, 'UTF-8'); ?>">
                <input type="hidden" name="action" value="save_customer">

                <div class="admin-form-grid">
                    <label>
                        <span>Customer name</span>
                        <input type="text" name="customer_name" value="<?php echo htmlspecialchars((string) ($selectedCustomer['name'] ?? ''), ENT_QUOTES, 'UTF-8'); ?>" required>
                    </label>

                    <label>
                        <span>Status</span>
                        <select name="customer_status">
                            <?php foreach ($customerStatusOptions as $statusValue => $statusLabel): ?>
                                <option value="<?php echo htmlspecialchars($statusValue, ENT_QUOTES, 'UTF-8'); ?>"<?php echo ($selectedCustomer['status'] ?? 'prospect') === $statusValue ? ' selected' : ''; ?>><?php echo htmlspecialchars($statusLabel, ENT_QUOTES, 'UTF-8'); ?></option>
                            <?php endforeach; ?>
                        </select>
                    </label>

                    <label>
                        <span>Phone</span>
                        <input type="text" name="customer_phone" value="<?php echo htmlspecialchars((string) ($selectedCustomer['phone'] ?? ''), ENT_QUOTES, 'UTF-8'); ?>">
                    </label>

                    <label>
                        <span>Email</span>
                        <input type="email" name="customer_email" value="<?php echo htmlspecialchars((string) ($selectedCustomer['email'] ?? ''), ENT_QUOTES, 'UTF-8'); ?>">
                    </label>

                    <label class="admin-form-grid__full">
                        <span>Area / location</span>
                        <input type="text" name="customer_location" value="<?php echo htmlspecialchars((string) ($selectedCustomer['location'] ?? ''), ENT_QUOTES, 'UTF-8'); ?>">
                    </label>

                    <label class="admin-form-grid__full">
                        <span>Notes</span>
                        <textarea name="customer_notes" rows="5"><?php echo htmlspecialchars((string) ($selectedCustomer['notes'] ?? ''), ENT_QUOTES, 'UTF-8'); ?></textarea>
                    </label>
                </div>

                <?php if (!empty($selectedCustomer['id'])): ?>
                    <div class="admin-crm-related-summary">
                        <div class="admin-crm-related-summary__heading">
                            <p class="admin-page-eyebrow">Linked Records</p>
                            <h3>Customer Activity</h3>
                        </div>
                        <div class="admin-crm-related-summary__stats">
                            <a href="crm.php?lead_customer_id=<?php echo urlencode((string) ($selectedCustomer['id'] ?? '')); ?>#crm-leads"><?php echo count($selectedCustomerLeadRecords); ?> linked leads</a>
                            <a href="crm.php?job_customer_id=<?php echo urlencode((string) ($selectedCustomer['id'] ?? '')); ?>#crm-jobs"><?php echo count($selectedCustomerJobRecords); ?> linked jobs</a>
                        </div>
                        <?php if (!empty($selectedCustomerLeadRecords)): ?>
                            <ul class="admin-crm-related-summary__list">
                                <?php foreach (array_slice($selectedCustomerLeadRecords, 0, 3) as $leadRecord): ?>
                                    <li><a href="crm.php?lead_id=<?php echo urlencode((string) ($leadRecord['id'] ?? '')); ?>&modal=lead"><?php echo htmlspecialchars((string) ($leadRecord['name'] ?? ''), ENT_QUOTES, 'UTF-8'); ?></a></li>
                                <?php endforeach; ?>
                            </ul>
                        <?php endif; ?>
                        <?php if (!empty($selectedCustomerJobRecords)): ?>
                            <ul class="admin-crm-related-summary__list">
                                <?php foreach (array_slice($selectedCustomerJobRecords, 0, 3) as $jobRecord): ?>
                                    <li><a href="crm.php?job_id=<?php echo urlencode((string) ($jobRecord['id'] ?? '')); ?>&modal=job"><?php echo htmlspecialchars((string) ($jobRecord['title'] ?? ''), ENT_QUOTES, 'UTF-8'); ?></a></li>
                                <?php endforeach; ?>
                            </ul>
                        <?php endif; ?>
                    </div>
                <?php endif; ?>

                <div class="admin-modal__footer">
                    <div class="admin-form-actions">
                        <button type="submit" class="btn">Save Customer</button>
                        <?php if (!empty($selectedCustomer['id'])): ?>
                            <button type="submit" class="btn btn--danger" name="action" value="delete_customer" onclick="return confirm('Delete this customer?');">Delete</button>
                        <?php endif; ?>
                    </div>
                </div>
            </form>
        </div>
    </section>

    <section class="admin-modal" data-admin-modal="job"<?php echo $isJobModalOpen ? '' : ' hidden'; ?>>
        <div class="admin-modal__backdrop" data-modal-close></div>
        <div class="admin-modal__dialog card" role="dialog" aria-modal="true" aria-labelledby="jobEditorTitle">
            <div class="admin-modal__header">
                <div>
                    <p class="admin-page-eyebrow">Job Editor</p>
                    <h2 id="jobEditorTitle"><?php echo !empty($selectedJob['id']) ? 'Edit Job' : 'Add Job'; ?></h2>
                </div>
                <a class="admin-modal__close" href="<?php echo htmlspecialchars($closeModalHref, ENT_QUOTES, 'UTF-8'); ?>" data-modal-close aria-label="Close job editor">X</a>
            </div>

            <form method="post" class="admin-form admin-form--stacked admin-modal__body">
                <input type="hidden" name="csrf_token" value="<?php echo htmlspecialchars((string) ($_SESSION['csrf_token'] ?? ''), ENT_QUOTES, 'UTF-8'); ?>">
                <input type="hidden" name="job_id" value="<?php echo htmlspecialchars((string) ($selectedJob['id'] ?? ''), ENT_QUOTES, 'UTF-8'); ?>">
                <input type="hidden" name="action" value="save_job">

                <div class="admin-form-grid">
                    <label>
                        <span>Job title</span>
                        <input type="text" name="job_title" value="<?php echo htmlspecialchars((string) ($selectedJob['title'] ?? ''), ENT_QUOTES, 'UTF-8'); ?>" required>
                    </label>

                    <label>
                        <span>Status</span>
                        <select name="job_status">
                            <?php foreach ($jobStatusOptions as $statusValue => $statusLabel): ?>
                                <option value="<?php echo htmlspecialchars($statusValue, ENT_QUOTES, 'UTF-8'); ?>"<?php echo ($selectedJob['status'] ?? 'scheduled') === $statusValue ? ' selected' : ''; ?>><?php echo htmlspecialchars($statusLabel, ENT_QUOTES, 'UTF-8'); ?></option>
                            <?php endforeach; ?>
                        </select>
                    </label>

                    <label>
                        <span>Service</span>
                        <select name="job_service_key">
                            <?php foreach ($jobServiceOptions as $serviceValue => $serviceLabel): ?>
                                <option value="<?php echo htmlspecialchars($serviceValue, ENT_QUOTES, 'UTF-8'); ?>"<?php echo ($selectedJob['service_key'] ?? '') === $serviceValue ? ' selected' : ''; ?>><?php echo htmlspecialchars($serviceLabel, ENT_QUOTES, 'UTF-8'); ?></option>
                            <?php endforeach; ?>
                        </select>
                    </label>

                    <label>
                        <span>Customer</span>
                        <select name="job_customer_id">
                            <?php foreach ($customerOptions as $customerValue => $customerLabel): ?>
                                <option value="<?php echo htmlspecialchars($customerValue, ENT_QUOTES, 'UTF-8'); ?>"<?php echo ($selectedJob['customer_id'] ?? '') === $customerValue ? ' selected' : ''; ?>><?php echo htmlspecialchars($customerLabel, ENT_QUOTES, 'UTF-8'); ?></option>
                            <?php endforeach; ?>
                        </select>
                    </label>

                    <label>
                        <span>Linked lead</span>
                        <select name="job_lead_id">
                            <?php foreach ($leadOptions as $leadValue => $leadLabel): ?>
                                <option value="<?php echo htmlspecialchars($leadValue, ENT_QUOTES, 'UTF-8'); ?>"<?php echo ($selectedJob['lead_id'] ?? '') === $leadValue ? ' selected' : ''; ?>><?php echo htmlspecialchars($leadLabel, ENT_QUOTES, 'UTF-8'); ?></option>
                            <?php endforeach; ?>
                        </select>
                    </label>

                    <label>
                        <span>Scheduled for</span>
                        <input type="datetime-local" name="job_scheduled_for" value="<?php echo htmlspecialchars((string) ($selectedJob['scheduled_for'] ?? ''), ENT_QUOTES, 'UTF-8'); ?>">
                    </label>

                    <label>
                        <span>Area / location</span>
                        <input type="text" name="job_location" value="<?php echo htmlspecialchars((string) ($selectedJob['location'] ?? ''), ENT_QUOTES, 'UTF-8'); ?>">
                    </label>

                    <label class="admin-form-grid__full">
                        <span>Notes</span>
                        <textarea name="job_notes" rows="5"><?php echo htmlspecialchars((string) ($selectedJob['notes'] ?? ''), ENT_QUOTES, 'UTF-8'); ?></textarea>
                    </label>
                </div>

                <?php if ($selectedJobDuplicateLeadCount > 0 && empty($selectedJob['id'])): ?>
                    <div class="admin-crm-related-summary admin-crm-related-summary--warning">
                        <div class="admin-crm-related-summary__heading">
                            <p class="admin-page-eyebrow">Duplicate Check</p>
                            <h3>This lead already has <?php echo (int) $selectedJobDuplicateLeadCount; ?> job<?php echo $selectedJobDuplicateLeadCount === 1 ? '' : 's'; ?></h3>
                        </div>
                        <?php if (!empty($selectedJobRelatedLeadJobs)): ?>
                            <ul class="admin-crm-related-summary__list">
                                <?php foreach ($selectedJobRelatedLeadJobs as $relatedJob): ?>
                                    <li><a href="crm.php?job_id=<?php echo urlencode((string) ($relatedJob['id'] ?? '')); ?>&modal=job"><?php echo htmlspecialchars((string) ($relatedJob['title'] ?? ''), ENT_QUOTES, 'UTF-8'); ?></a></li>
                                <?php endforeach; ?>
                            </ul>
                        <?php endif; ?>
                        <label class="admin-crm-inline-toggle">
                            <input type="checkbox" name="allow_duplicate_for_lead" value="1"<?php echo ($selectedJob['allow_duplicate_for_lead'] ?? '') === '1' ? ' checked' : ''; ?>>
                            <span>Allow another job for this lead</span>
                        </label>
                    </div>
                <?php endif; ?>

                <div class="admin-modal__footer">
                    <div class="admin-form-actions">
                        <button type="submit" class="btn">Save Job</button>
                        <?php if (!empty($selectedJob['id'])): ?>
                            <button type="submit" class="btn btn--danger" name="action" value="delete_job" onclick="return confirm('Delete this job?');">Delete</button>
                        <?php endif; ?>
                    </div>
                </div>
            </form>
        </div>
    </section>
</main>