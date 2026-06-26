<?php require_once __DIR__ . '/../partials/console-ui.php'; ?>
<main class="admin-main admin-main--console">
    <div class="wrapper admin-wrapper">
        <section class="card admin-feature-page-hero">
            <div class="admin-feature-page-hero__top">
                <div>
                    <p class="admin-page-eyebrow"><?php echo htmlspecialchars((string) ($groupTitle ?? 'Console'), ENT_QUOTES, 'UTF-8'); ?></p>
                    <h1><?php echo htmlspecialchars((string) ($featurePageTitle ?? 'Feature'), ENT_QUOTES, 'UTF-8'); ?></h1>
                    <p class="admin-page-intro"><?php echo htmlspecialchars((string) ($featurePageIntro ?? ''), ENT_QUOTES, 'UTF-8'); ?></p>
                </div>
                <div class="admin-feature-page-toolbar">
                    <a class="btn btn--secondary" href="<?php echo htmlspecialchars(admin_url((string) (($navigation[(string) ($groupKey ?? '')]['href'] ?? 'operations.php'))), ENT_QUOTES, 'UTF-8'); ?>">Back to <?php echo htmlspecialchars((string) ($groupTitle ?? 'Group'), ENT_QUOTES, 'UTF-8'); ?></a>
                    <?php if (($featurePageType ?? '') === 'table' && trim((string) ($addLabel ?? '')) !== ''): ?>
                        <a class="btn" href="?modal=record-editor&amp;feature_key=<?php echo htmlspecialchars((string) ($featurePageKey ?? ''), ENT_QUOTES, 'UTF-8'); ?>&amp;source_modal_id=<?php echo htmlspecialchars((string) ($featurePageKey ?? ''), ENT_QUOTES, 'UTF-8'); ?>&amp;create=1"><?php echo htmlspecialchars((string) $addLabel, ENT_QUOTES, 'UTF-8'); ?></a>
                    <?php endif; ?>
                    <?php if (($featurePageType ?? '') === 'image-library'): ?>
                        <button class="btn" type="button" data-console-modal-open="images-upload">Upload</button>
                        <button class="btn btn--secondary" type="button" data-console-modal-open="images-gallery">Gallery</button>
                        <button class="btn btn--secondary" type="button" data-console-modal-open="images-batch">Batch</button>
                        <a class="btn btn--secondary" href="<?php echo htmlspecialchars(admin_url('features/image-submissions.php'), ENT_QUOTES, 'UTF-8'); ?>">Submissions</a>
                    <?php endif; ?>
                </div>
            </div>
        </section>

        <?php if ($noticeMessage !== null): ?>
            <section class="admin-alert admin-alert--success" aria-live="polite"><?php echo htmlspecialchars((string) $noticeMessage, ENT_QUOTES, 'UTF-8'); ?></section>
        <?php endif; ?>
        <?php if ($errorMessage !== null): ?>
            <section class="admin-alert admin-alert--error" aria-live="assertive"><?php echo htmlspecialchars((string) $errorMessage, ENT_QUOTES, 'UTF-8'); ?></section>
        <?php endif; ?>

        <?php if (($featurePageType ?? '') === 'create-user'): ?>
            <section class="card admin-feature-page-card">
                <form class="admin-form admin-form--stacked" method="post">
                    <input type="hidden" name="csrf_token" value="<?php echo htmlspecialchars((string) ($_SESSION['csrf_token'] ?? ''), ENT_QUOTES, 'UTF-8'); ?>">
                    <input type="hidden" name="action" value="create_user">
                    <div class="admin-form-grid">
                        <label><span>Username</span><input type="text" name="username" required></label>
                        <label><span>Email</span><input type="email" name="email" required></label>
                        <label><span>Password</span><input type="password" name="password" minlength="8" required></label>
                    </div>
                    <div class="admin-form-actions"><button class="btn" type="submit">Create User</button></div>
                </form>
                <div class="admin-console-record-list">
                    <?php foreach (($adminUsers ?? []) as $user): ?>
                        <article class="admin-console-record-row"><div class="admin-console-record-row__content"><div class="admin-console-record-row__header"><h3><?php echo htmlspecialchars((string) ($user['username'] ?? ''), ENT_QUOTES, 'UTF-8'); ?></h3><?php render_admin_console_badge('User', 'default'); ?></div><p class="admin-console-record-row__meta"><?php echo htmlspecialchars((string) ($user['email'] ?? ''), ENT_QUOTES, 'UTF-8'); ?></p></div></article>
                    <?php endforeach; ?>
                </div>
            </section>
        <?php elseif (($featurePageType ?? '') === 'table-with-upload'): ?>
            <section class="card admin-feature-page-card">
                <form class="admin-form admin-form--stacked" method="post" enctype="multipart/form-data">
                    <input type="hidden" name="csrf_token" value="<?php echo htmlspecialchars((string) ($_SESSION['csrf_token'] ?? ''), ENT_QUOTES, 'UTF-8'); ?>">
                    <input type="hidden" name="action" value="upload_banking_csv">
                    <div class="admin-form-grid">
                        <label class="admin-form-grid__full"><span>CSV File</span><input type="file" name="csv_file" accept=".csv,text/csv" required></label>
                    </div>
                    <div class="admin-form-actions"><button class="btn" type="submit">Upload CSV</button></div>
                </form>
                <?php render_admin_console_table($featureRows ?? [], (string) ($featurePageKey ?? ''), 'all', (string) ($featurePageKey ?? '')); ?>
            </section>
        <?php elseif (($featurePageType ?? '') === 'image-library'): ?>
            <section class="card admin-feature-page-card">
                <div class="admin-stats-grid">
                    <article class="admin-stat-card"><span class="admin-stat-card__label">Library Images</span><strong><?php echo count($imageLibraryImages ?? []); ?></strong></article>
                    <article class="admin-stat-card"><span class="admin-stat-card__label">Tags</span><strong><?php echo count($imageLibraryTags ?? []); ?></strong></article>
                    <article class="admin-stat-card"><span class="admin-stat-card__label">Pending Submissions</span><strong><?php echo count(array_filter($imageSubmissions ?? [], static function (array $row): bool { return (string) ($row['status'] ?? '') === 'pending'; })); ?></strong></article>
                </div>
                <div class="admin-console-gallery-grid admin-console-gallery-grid--compact">
                    <?php foreach (array_slice($imageLibraryImages ?? [], 0, 9) as $image): ?>
                        <figure class="admin-console-gallery-card admin-console-gallery-card--bare"><button class="admin-console-gallery-thumb" type="button" data-console-modal-open="images-gallery"><img src="<?php echo htmlspecialchars((string) (($image['thumb_src'] ?? '') !== '' ? $image['thumb_src'] : ($image['src'] ?? '')), ENT_QUOTES, 'UTF-8'); ?>" alt="<?php echo htmlspecialchars((string) ($image['alt'] ?? 'Library image'), ENT_QUOTES, 'UTF-8'); ?>"></button></figure>
                    <?php endforeach; ?>
                </div>
            </section>
        <?php elseif (($featurePageType ?? '') === 'image-submissions'): ?>
            <section class="card admin-feature-page-card">
                <div class="admin-section-heading admin-section-heading--table">
                    <div>
                        <h2>Submission Queue</h2>
                        <p class="admin-section-caption">Review front-end uploads before they enter the public library.</p>
                    </div>
                    <a class="btn btn--secondary" href="<?php echo htmlspecialchars(admin_url('features/image-library.php'), ENT_QUOTES, 'UTF-8'); ?>">Open Library</a>
                </div>
                <?php if (!empty($imageSubmissions)): ?>
                    <div class="admin-console-record-list">
                        <?php foreach ($imageSubmissions as $submission): ?>
                            <article class="admin-console-record-row">
                                <div class="admin-console-record-row__content">
                                    <div class="admin-console-record-row__header">
                                        <h3><?php echo htmlspecialchars((string) (($submission['name'] ?? '') !== '' ? $submission['name'] : 'Photo Submission'), ENT_QUOTES, 'UTF-8'); ?></h3>
                                        <?php render_admin_console_badge((string) ($submission['status'] ?? 'pending'), (string) ($submission['status'] ?? 'default')); ?>
                                    </div>
                                    <p class="admin-console-record-row__meta"><?php echo htmlspecialchars(implode(' | ', array_filter([(string) ($submission['email'] ?? ''), (string) ($submission['phone'] ?? ''), (string) ($submission['submitted_at'] ?? ''), strtoupper((string) ($submission['extension'] ?? ''))])), ENT_QUOTES, 'UTF-8'); ?></p>
                                    <?php if (trim((string) ($submission['notes'] ?? '')) !== ''): ?><p class="admin-console-record-row__meta"><?php echo htmlspecialchars((string) ($submission['notes'] ?? ''), ENT_QUOTES, 'UTF-8'); ?></p><?php endif; ?>
                                </div>
                                <?php if (($submission['status'] ?? '') === 'pending'): ?>
                                    <div class="admin-console-record-actions admin-console-record-actions--stacked">
                                        <form method="post" class="admin-form admin-form--stacked admin-console-submission-form">
                                            <input type="hidden" name="csrf_token" value="<?php echo htmlspecialchars((string) ($_SESSION['csrf_token'] ?? ''), ENT_QUOTES, 'UTF-8'); ?>">
                                            <input type="hidden" name="action" value="approve_image_submission">
                                            <input type="hidden" name="submission_id" value="<?php echo htmlspecialchars((string) ($submission['id'] ?? ''), ENT_QUOTES, 'UTF-8'); ?>">
                                            <input type="text" name="submission_alt" placeholder="Alt text" value="<?php echo htmlspecialchars((string) ($submission['alt'] ?? ''), ENT_QUOTES, 'UTF-8'); ?>">
                                            <input type="text" name="visible_on_page" placeholder="Visible on page (optional)">
                                            <input type="text" name="custom_tags" placeholder="Extra tags (comma separated)">
                                            <button class="btn" type="submit">Approve to Library</button>
                                        </form>
                                        <form method="post">
                                            <input type="hidden" name="csrf_token" value="<?php echo htmlspecialchars((string) ($_SESSION['csrf_token'] ?? ''), ENT_QUOTES, 'UTF-8'); ?>">
                                            <input type="hidden" name="action" value="reject_image_submission">
                                            <input type="hidden" name="submission_id" value="<?php echo htmlspecialchars((string) ($submission['id'] ?? ''), ENT_QUOTES, 'UTF-8'); ?>">
                                            <button class="btn btn--danger" type="submit">Reject</button>
                                        </form>
                                    </div>
                                <?php endif; ?>
                            </article>
                        <?php endforeach; ?>
                    </div>
                <?php else: ?>
                    <p class="admin-section-caption">No photo submissions have been received yet.</p>
                <?php endif; ?>
            </section>
        <?php elseif (($featurePageType ?? '') === 'integrations'): ?>
            <section class="card admin-feature-page-card admin-console-integrations-manager" data-integration-manager-root data-integration-templates="<?php echo htmlspecialchars(json_encode($integrationTypeTemplates, JSON_UNESCAPED_SLASHES), ENT_QUOTES, 'UTF-8'); ?>" data-integration-help-text="<?php echo htmlspecialchars(json_encode($integrationTypeHelpText, JSON_UNESCAPED_SLASHES), ENT_QUOTES, 'UTF-8'); ?>">
                <div class="admin-console-integrations-manager__meta">
                    <div>
                        <p class="admin-section-caption">Webhook endpoint files: <?php echo htmlspecialchars((string) ($integrationStorageDirectories['endpoints'] ?? ''), ENT_QUOTES, 'UTF-8'); ?></p>
                        <p class="admin-section-caption">Key storage files: <?php echo htmlspecialchars((string) ($integrationStorageDirectories['keys'] ?? ''), ENT_QUOTES, 'UTF-8'); ?></p>
                    </div>
                    <button class="btn btn--secondary" type="button" data-integration-form-reset>New Integration</button>
                </div>
                <div class="admin-console-integrations-manager__grid">
                    <form class="admin-form admin-form--stacked admin-console-integrations-form" method="post" data-integration-form>
                        <input type="hidden" name="csrf_token" value="<?php echo htmlspecialchars((string) ($_SESSION['csrf_token'] ?? ''), ENT_QUOTES, 'UTF-8'); ?>">
                        <input type="hidden" name="action" value="save_integration">
                        <input type="hidden" name="id" value="<?php echo htmlspecialchars((string) ($integrationFormRecord['id'] ?? ''), ENT_QUOTES, 'UTF-8'); ?>" data-integration-field="id">
                        <div class="admin-form-grid">
                            <label><span>Name</span><input type="text" name="name" value="<?php echo htmlspecialchars((string) ($integrationFormRecord['name'] ?? ''), ENT_QUOTES, 'UTF-8'); ?>" data-integration-field="name" required></label>
                            <label><span>Service</span><select name="service_key" data-integration-field="service_key" data-integration-service-select><?php foreach ($integrationServiceOptions as $serviceKey => $serviceLabel): ?><option value="<?php echo htmlspecialchars((string) $serviceKey, ENT_QUOTES, 'UTF-8'); ?>"<?php echo ($integrationFormRecord['service_key'] ?? '') === $serviceKey ? ' selected' : ''; ?>><?php echo htmlspecialchars((string) $serviceLabel, ENT_QUOTES, 'UTF-8'); ?></option><?php endforeach; ?><option value="__custom__"<?php echo ($integrationFormRecord['service_key'] ?? '') === '__custom__' ? ' selected' : ''; ?>>Add Service</option></select></label>
                            <label class="admin-console-custom-service-field<?php echo ($integrationFormRecord['service_key'] ?? '') === '__custom__' ? '' : ' is-hidden'; ?>" data-integration-custom-service><span>Add Service</span><input type="text" name="custom_service_label" value="<?php echo htmlspecialchars((string) ($integrationFormRecord['custom_service_label'] ?? ''), ENT_QUOTES, 'UTF-8'); ?>" data-integration-field="custom_service_label"></label>
                            <label><span>Type</span><select name="type_key" data-integration-field="type_key" data-integration-type-select><?php foreach ($integrationTypeOptions as $typeKey => $typeLabel): ?><option value="<?php echo htmlspecialchars((string) $typeKey, ENT_QUOTES, 'UTF-8'); ?>"<?php echo ($integrationFormRecord['type_key'] ?? '') === $typeKey ? ' selected' : ''; ?>><?php echo htmlspecialchars((string) $typeLabel, ENT_QUOTES, 'UTF-8'); ?></option><?php endforeach; ?></select></label>
                            <label class="admin-form-grid__full"><span>Data</span><textarea name="data_json" rows="12" data-integration-field="data_json" data-integration-data-input required><?php echo htmlspecialchars((string) ($integrationFormRecord['data_json'] ?? ''), ENT_QUOTES, 'UTF-8'); ?></textarea><small class="admin-console-helper" data-integration-help><?php echo htmlspecialchars((string) ($integrationTypeHelpText[$integrationFormRecord['type_key'] ?? 'snippet'] ?? ''), ENT_QUOTES, 'UTF-8'); ?></small></label>
                        </div>
                        <div class="admin-console-action-row"><button class="btn" type="submit">Save Integration</button><button class="btn btn--secondary" type="button" data-integration-template-fill>Use Template</button></div>
                    </form>
                    <section class="admin-console-integrations-browser">
                        <div class="admin-console-table-tools admin-console-table-tools--inline">
                            <label><span>Search</span><input type="search" placeholder="Search integrations" data-integration-filter-search></label>
                            <label><span>Service</span><select data-integration-filter-service><option value="">All services</option><?php foreach ($integrationServiceOptions as $serviceKey => $serviceLabel): ?><option value="<?php echo htmlspecialchars((string) $serviceKey, ENT_QUOTES, 'UTF-8'); ?>"><?php echo htmlspecialchars((string) $serviceLabel, ENT_QUOTES, 'UTF-8'); ?></option><?php endforeach; ?></select></label>
                            <label><span>Type</span><select data-integration-filter-type><option value="">All types</option><?php foreach ($integrationTypeOptions as $typeKey => $typeLabel): ?><option value="<?php echo htmlspecialchars((string) $typeKey, ENT_QUOTES, 'UTF-8'); ?>"><?php echo htmlspecialchars((string) $typeLabel, ENT_QUOTES, 'UTF-8'); ?></option><?php endforeach; ?></select></label>
                        </div>
                        <div class="admin-console-record-list admin-console-record-list--integrations">
                            <?php foreach ($integrationRecords as $record): ?>
                                <?php $recordSearch = strtolower(implode(' ', [(string) ($record['name'] ?? ''), (string) ($record['service_label'] ?? ''), (string) ($record['type_label'] ?? ''), (string) ($record['summary'] ?? '')])); $recordMeta = get_admin_console_integration_meta($record); ?>
                                <article class="admin-console-record-row admin-console-record-row--integration" data-integration-row data-search="<?php echo htmlspecialchars($recordSearch, ENT_QUOTES, 'UTF-8'); ?>" data-service="<?php echo htmlspecialchars((string) ($record['service_key'] ?? ''), ENT_QUOTES, 'UTF-8'); ?>" data-type="<?php echo htmlspecialchars((string) ($record['type_key'] ?? ''), ENT_QUOTES, 'UTF-8'); ?>">
                                    <div class="admin-console-record-row__content"><div class="admin-console-record-row__header"><h3><?php echo htmlspecialchars((string) ($record['name'] ?? 'Integration'), ENT_QUOTES, 'UTF-8'); ?></h3><?php render_admin_console_badge((string) ($record['type_label'] ?? ''), (string) ($record['type_key'] ?? 'default')); ?></div><?php if ($recordMeta !== []): ?><p class="admin-console-record-row__meta"><?php echo htmlspecialchars(implode(' | ', $recordMeta), ENT_QUOTES, 'UTF-8'); ?></p><?php endif; ?></div>
                                    <?php render_admin_console_integration_actions($record); ?>
                                </article>
                            <?php endforeach; ?>
                        </div>
                    </section>
                </div>
            </section>
        <?php else: ?>
            <section class="card admin-feature-page-card">
                <?php if (($featurePageKey ?? '') === 'journal'): ?>
                    <div class="admin-console-modal-toolbar"><a class="btn" href="?modal=record-editor&amp;feature_key=journal&amp;source_modal_id=journal&amp;create=1">Add</a></div>
                <?php endif; ?>
                <?php render_admin_console_table($featureRows ?? [], (string) ($featurePageKey ?? ''), 'all', (string) ($featurePageKey ?? '')); ?>
            </section>
        <?php endif; ?>
    </div>

    <?php if (in_array((string) ($featurePageType ?? ''), ['table', 'table-with-upload'], true)): ?>
        <section class="admin-modal admin-console-modal" data-console-modal="record-editor"<?php echo ($activeModalId ?? '') === 'record-editor' ? '' : ' hidden'; ?>>
            <div class="admin-modal__backdrop" data-console-modal-close></div>
            <div class="admin-modal__dialog card" role="dialog" aria-modal="true" aria-labelledby="modalTitle-record-editor">
                <div class="admin-modal__header"><div><p class="admin-page-eyebrow"><?php echo htmlspecialchars((string) ($groupTitle ?? 'Console'), ENT_QUOTES, 'UTF-8'); ?></p><h2 id="modalTitle-record-editor"><?php echo htmlspecialchars((string) (($recordEditorState['title'] ?? 'Edit Record')), ENT_QUOTES, 'UTF-8'); ?></h2></div><button class="admin-modal__close" type="button" data-console-modal-close aria-label="Close">X</button></div>
                <div class="admin-modal__body admin-console-modal__body">
                    <form class="admin-form admin-form--stacked admin-console-record-editor" method="post" data-console-record-form>
                        <input type="hidden" name="csrf_token" value="<?php echo htmlspecialchars((string) ($_SESSION['csrf_token'] ?? ''), ENT_QUOTES, 'UTF-8'); ?>">
                        <input type="hidden" name="action" value="save_console_record" data-console-record-action>
                        <input type="hidden" name="feature_key" value="<?php echo htmlspecialchars((string) ($recordEditorState['feature_key'] ?? ($featurePageKey ?? '')), ENT_QUOTES, 'UTF-8'); ?>" data-console-record-feature-input>
                        <input type="hidden" name="record_id" value="<?php echo htmlspecialchars((string) ($recordEditorState['record_id'] ?? ''), ENT_QUOTES, 'UTF-8'); ?>" data-console-record-id-input>
                        <input type="hidden" name="source_modal_id" value="<?php echo htmlspecialchars((string) ($recordEditorState['source_modal_id'] ?? ($featurePageKey ?? '')), ENT_QUOTES, 'UTF-8'); ?>" data-console-record-source-modal-input>
                        <input type="hidden" name="source_invoice_id" value="<?php echo htmlspecialchars((string) ($recordEditorState['source_invoice_id'] ?? ''), ENT_QUOTES, 'UTF-8'); ?>">
                        <input type="hidden" name="mark_invoice_paid" value="<?php echo !empty($recordEditorState['mark_invoice_paid']) ? '1' : '0'; ?>">
                        <div class="admin-alert admin-alert--error admin-console-record-editor__notice<?php echo !empty($recordEditorState['editable']) ? ' is-hidden' : ''; ?>" data-console-record-readonly><?php echo htmlspecialchars((string) ($recordEditorState['read_only_message'] ?? 'This row is read only.'), ENT_QUOTES, 'UTF-8'); ?></div>
                        <div class="admin-form-grid" data-console-record-fields><?php render_admin_console_record_editor_fields($recordEditorState['fields'] ?? [], !empty($recordEditorState['editable'])); ?></div>
                        <div class="admin-form-actions admin-console-record-editor__actions"><button class="btn" type="submit" data-console-record-save<?php echo !empty($recordEditorState['editable']) ? '' : ' disabled'; ?>>Save</button><button class="btn btn--danger" type="submit" formaction="" formmethod="post" name="action" value="delete_console_record" data-console-record-delete<?php echo !empty($recordEditorState['editable']) && trim((string) ($recordEditorState['record_id'] ?? '')) !== '' ? '' : ' disabled'; ?>>Delete</button></div>
                    </form>
                </div>
            </div>
        </section>
    <?php endif; ?>

    <?php if (($featurePageType ?? '') === 'image-library'): ?>
        <section class="admin-modal admin-console-modal" data-console-modal="images-gallery"<?php echo ($activeModalId ?? '') === 'images-gallery' ? '' : ' hidden'; ?>><div class="admin-modal__backdrop" data-console-modal-close></div><div class="admin-modal__dialog card" role="dialog" aria-modal="true" aria-labelledby="featureImagesGalleryTitle"><div class="admin-modal__header"><div><p class="admin-page-eyebrow">Images</p><h2 id="featureImagesGalleryTitle">Image Gallery</h2></div><button class="admin-modal__close" type="button" data-console-modal-close aria-label="Close">X</button></div><div class="admin-modal__body admin-console-modal__body"><section class="admin-console-gallery-shell"><div class="admin-console-gallery-filter"><?php render_admin_console_image_tag_selector('gallery', $imageLibraryTags, 'Search tags'); ?></div><div class="admin-console-gallery-grid admin-console-gallery-grid--compact"><?php foreach ($imageLibraryImages as $image): ?><?php $imageTags = isset($image['tags']) && is_array($image['tags']) ? implode(' ', $image['tags']) : ''; ?><figure class="admin-console-gallery-card admin-console-gallery-card--bare" data-gallery-item data-tags="<?php echo htmlspecialchars($imageTags, ENT_QUOTES, 'UTF-8'); ?>"><button class="admin-console-gallery-thumb" type="button" data-carousel-open data-id="<?php echo htmlspecialchars((string) ($image['id'] ?? ''), ENT_QUOTES, 'UTF-8'); ?>" data-src="<?php echo htmlspecialchars((string) ($image['src'] ?? ''), ENT_QUOTES, 'UTF-8'); ?>" data-alt="<?php echo htmlspecialchars((string) ($image['alt'] ?? 'Library image'), ENT_QUOTES, 'UTF-8'); ?>" data-tags="<?php echo htmlspecialchars($imageTags, ENT_QUOTES, 'UTF-8'); ?>" data-visible-on-page="<?php echo htmlspecialchars((string) ($image['visible_on_page'] ?? ''), ENT_QUOTES, 'UTF-8'); ?>"><img src="<?php echo htmlspecialchars((string) (($image['thumb_src'] ?? '') !== '' ? $image['thumb_src'] : ($image['src'] ?? '')), ENT_QUOTES, 'UTF-8'); ?>" alt="<?php echo htmlspecialchars((string) ($image['alt'] ?? 'Library image'), ENT_QUOTES, 'UTF-8'); ?>"></button></figure><?php endforeach; ?></div></section></div></div></section>
        <section class="admin-modal admin-console-modal" data-console-modal="images-upload"<?php echo ($activeModalId ?? '') === 'images-upload' ? '' : ' hidden'; ?>><div class="admin-modal__backdrop" data-console-modal-close></div><div class="admin-modal__dialog card" role="dialog" aria-modal="true" aria-labelledby="featureImagesUploadTitle"><div class="admin-modal__header"><div><p class="admin-page-eyebrow">Images</p><h2 id="featureImagesUploadTitle">Upload Image</h2></div><button class="admin-modal__close" type="button" data-console-modal-close aria-label="Close">X</button></div><div class="admin-modal__body admin-console-modal__body"><form class="admin-form admin-form--stacked admin-console-image-form" method="post" enctype="multipart/form-data"><input type="hidden" name="csrf_token" value="<?php echo htmlspecialchars((string) ($_SESSION['csrf_token'] ?? ''), ENT_QUOTES, 'UTF-8'); ?>"><input type="hidden" name="action" value="upload_image"><div class="admin-console-tag-selector-shell"><?php render_admin_console_image_tag_selector('upload', $imageLibraryTags, 'Search tags', 'selected_tags[]'); ?></div><div class="admin-form-grid"><label class="admin-form-grid__full"><span>File Name Override</span><input type="text" name="file_name_override" placeholder="Optional clean file name"></label><label class="admin-form-grid__full admin-console-upload-field"><span>Image file</span><label class="btn admin-console-upload-button" for="adminFeatureImageUploadInput" data-image-upload-trigger><span data-image-upload-label>Choose images</span></label><input id="adminFeatureImageUploadInput" class="admin-console-upload-input" type="file" name="image_file[]" accept="image/*" multiple required data-image-upload-input></label><label><span>Alt text</span><input type="text" name="image_alt"></label><label><span>Custom tags</span><input type="text" name="custom_tags" placeholder="Comma separated"></label></div><div class="admin-form-actions"><button class="btn" type="submit">Upload Image</button></div></form></div></div></section>
        <section class="admin-modal admin-console-modal" data-console-modal="image-carousel"<?php echo ($activeModalId ?? '') === 'image-carousel' ? '' : ' hidden'; ?>><div class="admin-modal__backdrop" data-console-modal-close></div><div class="admin-modal__dialog card" role="dialog" aria-modal="true" aria-labelledby="featureImageCarouselTitle"><div class="admin-modal__header"><div><p class="admin-page-eyebrow">Images</p><h2 id="featureImageCarouselTitle">Gallery</h2></div><button class="admin-modal__close" type="button" data-console-modal-close aria-label="Close">X</button></div><div class="admin-modal__body admin-console-modal__body"><section class="admin-console-carousel" data-image-carousel><div class="admin-console-carousel__stage"><button class="btn btn--secondary admin-console-carousel__nav" type="button" data-carousel-previous>Previous</button><figure class="admin-console-carousel__figure"><img src="" alt="" data-carousel-image><figcaption><strong data-carousel-caption></strong><span data-carousel-meta></span></figcaption></figure><button class="btn btn--secondary admin-console-carousel__nav" type="button" data-carousel-next>Next</button></div><div class="admin-console-action-row admin-console-carousel__actions"><button class="btn" type="button" data-carousel-edit>Edit</button><button class="btn btn--secondary" type="button" data-console-modal-close>Close</button></div></section></div></div></section>
        <section class="admin-modal admin-console-modal" data-console-modal="image-edit"<?php echo ($activeModalId ?? '') === 'image-edit' ? '' : ' hidden'; ?>><div class="admin-modal__backdrop" data-console-modal-close></div><div class="admin-modal__dialog card" role="dialog" aria-modal="true" aria-labelledby="featureImageEditTitle"><div class="admin-modal__header"><div><p class="admin-page-eyebrow">Images</p><h2 id="featureImageEditTitle">Edit Image</h2></div><button class="admin-modal__close" type="button" data-console-modal-close aria-label="Close">X</button></div><div class="admin-modal__body admin-console-modal__body"><form class="admin-form admin-form--stacked admin-console-image-form" method="post" data-image-edit-form><input type="hidden" name="csrf_token" value="<?php echo htmlspecialchars((string) ($_SESSION['csrf_token'] ?? ''), ENT_QUOTES, 'UTF-8'); ?>"><input type="hidden" name="action" value="save_image_record"><input type="hidden" name="id" value="<?php echo htmlspecialchars((string) ($imageEditRecord['id'] ?? ''), ENT_QUOTES, 'UTF-8'); ?>" data-image-edit-field="id"><div class="admin-form-grid"><label><span>Alt text</span><input type="text" name="alt" value="<?php echo htmlspecialchars((string) ($imageEditRecord['alt'] ?? ''), ENT_QUOTES, 'UTF-8'); ?>" data-image-edit-field="alt"></label><label><span>Visible On Page</span><input type="text" name="visible_on_page" value="<?php echo htmlspecialchars((string) ($imageEditRecord['visible_on_page'] ?? ''), ENT_QUOTES, 'UTF-8'); ?>" data-image-edit-field="visible_on_page"></label><label class="admin-form-grid__full"><span>Tags</span><?php render_admin_console_image_tag_selector('edit', $imageLibraryTags, 'Search tags', 'selected_tags[]', $imageEditRecord['tags'] ?? []); ?></label><label class="admin-form-grid__full"><span>Custom tags</span><input type="text" name="custom_tags" placeholder="Comma separated"></label></div><div class="admin-form-actions"><button class="btn" type="submit">Save Image</button></div></form><?php $activeImageRecord = get_image_library_image_by_id((string) ($imageEditRecord['id'] ?? '')); ?><?php if ($activeImageRecord !== null): ?><section class="admin-console-transform-panel"><div class="admin-section-heading admin-section-heading--table"><div><h3>Process Image</h3><p class="admin-section-caption">Resize or convert the live library image and regenerate its thumbnail.</p></div></div><form class="admin-form admin-form--stacked admin-console-image-form" method="post"><input type="hidden" name="csrf_token" value="<?php echo htmlspecialchars((string) ($_SESSION['csrf_token'] ?? ''), ENT_QUOTES, 'UTF-8'); ?>"><input type="hidden" name="action" value="process_image_asset"><input type="hidden" name="id" value="<?php echo htmlspecialchars((string) ($activeImageRecord['id'] ?? ''), ENT_QUOTES, 'UTF-8'); ?>"><div class="admin-form-grid"><label><span>Format</span><select name="variant_format"><option value="keep">Keep current</option><option value="jpg">JPEG</option><option value="png">PNG</option><option value="webp">WEBP</option></select></label><label><span>Max width</span><input type="number" name="variant_max_width" min="0" step="1" placeholder="1600"></label><label><span>Max height</span><input type="number" name="variant_max_height" min="0" step="1" placeholder="0"></label></div><div class="admin-form-actions"><button class="btn btn--secondary" type="submit">Process Image</button></div></form></section><?php endif; ?></div></div></section>
        <section class="admin-modal admin-console-modal" data-console-modal="images-batch"<?php echo ($activeModalId ?? '') === 'images-batch' ? '' : ' hidden'; ?>><div class="admin-modal__backdrop" data-console-modal-close></div><div class="admin-modal__dialog card" role="dialog" aria-modal="true" aria-labelledby="featureImagesBatchTitle"><div class="admin-modal__header"><div><p class="admin-page-eyebrow">Images</p><h2 id="featureImagesBatchTitle">Batch Tools</h2></div><button class="admin-modal__close" type="button" data-console-modal-close aria-label="Close">X</button></div><div class="admin-modal__body admin-console-modal__body"><section class="admin-console-transform-panel"><div class="admin-section-heading admin-section-heading--table"><div><h3>Batch Image Tools</h3><p class="admin-section-caption">Process the live library images matched by the selected tags.</p></div></div><form class="admin-form admin-form--stacked admin-console-image-form" method="post"><input type="hidden" name="csrf_token" value="<?php echo htmlspecialchars((string) ($_SESSION['csrf_token'] ?? ''), ENT_QUOTES, 'UTF-8'); ?>"><input type="hidden" name="action" value="batch_process_image_assets"><?php render_admin_console_image_tag_selector('batch', $imageLibraryTags, 'Search tags', 'selected_tags[]', $imageBatchState['selected_tags'] ?? []); ?><div class="admin-form-grid"><label><span>Format</span><select name="batch_format"><option value="jpg"<?php echo ($imageBatchState['format'] ?? '') === 'jpg' ? ' selected' : ''; ?>>JPEG</option><option value="png"<?php echo ($imageBatchState['format'] ?? '') === 'png' ? ' selected' : ''; ?>>PNG</option><option value="webp"<?php echo ($imageBatchState['format'] ?? 'webp') === 'webp' ? ' selected' : ''; ?>>WEBP</option></select></label><label><span>Max width</span><input type="number" name="batch_max_width" min="0" step="1" value="<?php echo htmlspecialchars((string) ($imageBatchState['max_width'] ?? '1600'), ENT_QUOTES, 'UTF-8'); ?>"></label><label><span>Max height</span><input type="number" name="batch_max_height" min="0" step="1" value="<?php echo htmlspecialchars((string) ($imageBatchState['max_height'] ?? '0'), ENT_QUOTES, 'UTF-8'); ?>"></label><label><span>Additional tags</span><input type="text" name="custom_tags" value="<?php echo htmlspecialchars((string) ($imageBatchState['custom_tags'] ?? ''), ENT_QUOTES, 'UTF-8'); ?>" placeholder="Comma separated"></label></div><div class="admin-form-actions"><button class="btn" type="submit">Run Batch</button></div></form></section></div></div></section>
    <?php endif; ?>
</main>