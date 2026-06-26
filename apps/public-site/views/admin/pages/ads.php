<?php
$selectedPreviewHref = build_preview_ad_href($selectedAd);
$selectedImageSrc = trim((string) ($selectedAd['image_src'] ?? ''));
$selectedImageAlt = trim((string) ($selectedAd['image_alt'] ?? ''));
$tableHighlightId = trim((string) ($selectedAd['id'] ?? ''));
$isAdModalOpen = $activeModal === 'ad';
$isImagesModalOpen = $activeModal === 'images';
$closeModalHref = 'ads.php?group=' . urlencode($selectedGroupKey);
?>
<main class="admin-main admin-main--ads">
    <div class="wrapper admin-wrapper">
        <section class="admin-page-hero card">
            <div class="admin-ads-hero__top">
                <div>
                    <p class="admin-page-eyebrow">Website Controls</p>
                    <h1>Ads Manager</h1>
                    <p class="admin-page-intro">Manage modal ad variants by page group, keep the default row editable, and handle image uploads through a reusable tagged library.</p>
                </div>
                <div class="admin-ads-toolbar">
                    <a class="btn" href="ads.php?group=<?php echo urlencode($selectedGroupKey); ?>&new=1&modal=ad">Add Ad</a>
                    <button type="button" class="btn btn--secondary" data-modal-open="images">Image Library</button>
                </div>
            </div>

            <div class="admin-stats-grid">
                <article class="admin-stat-card">
                    <span class="admin-stat-card__label">Ad Groups</span>
                    <strong><?php echo count($adsByGroup); ?></strong>
                </article>
                <article class="admin-stat-card">
                    <span class="admin-stat-card__label">Total Ads</span>
                    <strong><?php echo $totalAds; ?></strong>
                </article>
                <article class="admin-stat-card">
                    <span class="admin-stat-card__label">Active Ads</span>
                    <strong><?php echo $activeAds; ?></strong>
                </article>
            </div>
        </section>

        <?php if ($noticeMessage !== null): ?>
            <section class="admin-alert admin-alert--success" aria-live="polite"><?php echo htmlspecialchars($noticeMessage, ENT_QUOTES, 'UTF-8'); ?></section>
        <?php endif; ?>

        <?php if ($error !== null): ?>
            <section class="admin-alert admin-alert--error" aria-live="assertive"><?php echo htmlspecialchars($error, ENT_QUOTES, 'UTF-8'); ?></section>
        <?php endif; ?>

        <section class="admin-ads-groups">
            <?php foreach ($adsByGroup as $groupKey => $groupData): ?>
                <?php $defaultRecord = $groupData['ads'][0] ?? null; ?>
                <section class="card admin-ads-group-card">
                    <div class="admin-section-heading admin-section-heading--table">
                        <div>
                            <p class="admin-page-eyebrow">Group</p>
                            <h2><?php echo htmlspecialchars($groupData['group']['label'], ENT_QUOTES, 'UTF-8'); ?></h2>
                            <p class="admin-section-caption">Runs on <?php echo htmlspecialchars($groupData['group']['page_label'], ENT_QUOTES, 'UTF-8'); ?>. The first row stays the editable default for this service.</p>
                        </div>
                        <div class="admin-ads-group-actions">
                            <?php if ($defaultRecord !== null): ?>
                                <a class="btn btn--secondary" href="ads.php?group=<?php echo urlencode($groupKey); ?>&id=<?php echo urlencode((string) ($defaultRecord['id'] ?? '')); ?>&modal=ad">Edit Default</a>
                            <?php endif; ?>
                            <a class="btn" href="ads.php?group=<?php echo urlencode($groupKey); ?>&new=1&modal=ad">Add Ad</a>
                        </div>
                    </div>

                    <div class="admin-table-shell">
                        <table class="admin-data-table ads-data-table">
                            <thead>
                                <tr>
                                    <th>Ad</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php foreach ($groupData['ads'] as $record): ?>
                                    <?php $isSelected = $tableHighlightId !== '' && $tableHighlightId === (string) ($record['id'] ?? ''); ?>
                                    <?php $isActive = (string) ($record['status'] ?? 'draft') === 'active'; ?>
                                    <?php $imageFileName = basename((string) ($record['image_src'] ?? '')); ?>
                                    <tr class="ads-data-table__row<?php echo $isSelected ? ' is-selected' : ''; ?>">
                                        <td class="admin-ads-row__main">
                                            <div class="admin-ads-row__badges">
                                                <?php if (!empty($record['is_default'])): ?>
                                                    <span class="admin-badge admin-badge--accent admin-badge--small">Default</span>
                                                <?php endif; ?>
                                                <span class="admin-badge <?php echo $isActive ? 'admin-badge--status-active' : 'admin-badge--status-draft'; ?> admin-badge--small"><?php echo $isActive ? 'Active' : 'Inactive'; ?></span>
                                            </div>
                                            <strong class="admin-ads-row__name"><?php echo htmlspecialchars((string) ($record['internal_name'] ?? ''), ENT_QUOTES, 'UTF-8'); ?></strong>
                                            <span class="admin-ads-row__url">url: <?php echo htmlspecialchars((string) ($record['url_key'] ?? ''), ENT_QUOTES, 'UTF-8'); ?><?php if ($imageFileName !== ''): ?> · image: <?php echo htmlspecialchars($imageFileName, ENT_QUOTES, 'UTF-8'); ?><?php endif; ?></span>
                                        </td>
                                        <td>
                                            <a class="btn btn--secondary admin-table-action" href="ads.php?group=<?php echo urlencode($groupKey); ?>&id=<?php echo urlencode((string) ($record['id'] ?? '')); ?>&modal=ad">Edit</a>
                                        </td>
                                    </tr>
                                <?php endforeach; ?>
                            </tbody>
                        </table>
                    </div>
                </section>
            <?php endforeach; ?>
        </section>
    </div>

    <section class="admin-modal" data-admin-modal="ad"<?php echo $isAdModalOpen ? '' : ' hidden'; ?>>
        <div class="admin-modal__backdrop" data-modal-close></div>
        <div class="admin-modal__dialog card" role="dialog" aria-modal="true" aria-labelledby="adEditorTitle">
            <div class="admin-modal__header">
                <div>
                    <p class="admin-page-eyebrow">Ad Editor</p>
                    <h2 id="adEditorTitle"><?php echo !empty($selectedAd['id']) ? 'Edit Ad' : 'Add Ad'; ?></h2>
                </div>
                <div class="admin-modal__header-actions">
                    <a class="admin-text-link" href="<?php echo htmlspecialchars($selectedPreviewHref, ENT_QUOTES, 'UTF-8'); ?>" target="_blank" rel="noreferrer">Preview public modal</a>
                    <a class="admin-modal__close" href="<?php echo htmlspecialchars($closeModalHref, ENT_QUOTES, 'UTF-8'); ?>" data-modal-close aria-label="Close ad editor">X</a>
                </div>
            </div>

            <form method="post" class="admin-form admin-form--stacked admin-modal__body">
                <input type="hidden" name="csrf_token" value="<?php echo htmlspecialchars((string) ($_SESSION['csrf_token'] ?? ''), ENT_QUOTES, 'UTF-8'); ?>">
                <input type="hidden" name="id" value="<?php echo htmlspecialchars((string) ($selectedAd['id'] ?? ''), ENT_QUOTES, 'UTF-8'); ?>">
                <input type="hidden" name="action" value="save">

                <div class="admin-form-grid">
                    <label>
                        <span>Group</span>
                        <select name="group_key"<?php echo !empty($selectedAd['is_default']) ? ' disabled' : ''; ?>>
                            <?php foreach ($adGroups as $groupKey => $groupMeta): ?>
                                <option value="<?php echo htmlspecialchars($groupKey, ENT_QUOTES, 'UTF-8'); ?>"<?php echo $groupKey === $selectedGroupKey ? ' selected' : ''; ?>><?php echo htmlspecialchars($groupMeta['label'], ENT_QUOTES, 'UTF-8'); ?></option>
                            <?php endforeach; ?>
                        </select>
                        <?php if (!empty($selectedAd['is_default'])): ?>
                            <input type="hidden" name="group_key" value="<?php echo htmlspecialchars($selectedGroupKey, ENT_QUOTES, 'UTF-8'); ?>">
                        <?php endif; ?>
                    </label>

                    <label>
                        <span>Status</span>
                        <select name="status">
                            <?php foreach (['active' => 'Active', 'draft' => 'Draft', 'paused' => 'Paused'] as $statusValue => $statusLabel): ?>
                                <option value="<?php echo htmlspecialchars($statusValue, ENT_QUOTES, 'UTF-8'); ?>"<?php echo ($selectedAd['status'] ?? 'draft') === $statusValue ? ' selected' : ''; ?>><?php echo htmlspecialchars($statusLabel, ENT_QUOTES, 'UTF-8'); ?></option>
                            <?php endforeach; ?>
                        </select>
                    </label>

                    <label>
                        <span>Internal name</span>
                        <input type="text" name="internal_name" value="<?php echo htmlspecialchars((string) ($selectedAd['internal_name'] ?? ''), ENT_QUOTES, 'UTF-8'); ?>" required>
                    </label>

                    <label>
                        <span>URL key</span>
                        <input type="text" name="url_key" value="<?php echo htmlspecialchars((string) ($selectedAd['url_key'] ?? ''), ENT_QUOTES, 'UTF-8'); ?>" required>
                    </label>

                    <label class="admin-form-grid__full">
                        <span>Headline</span>
                        <input type="text" name="headline" value="<?php echo htmlspecialchars((string) ($selectedAd['headline'] ?? ''), ENT_QUOTES, 'UTF-8'); ?>" required>
                    </label>

                    <label class="admin-form-grid__full">
                        <span>Problem</span>
                        <input type="text" name="problem" value="<?php echo htmlspecialchars((string) ($selectedAd['problem'] ?? ''), ENT_QUOTES, 'UTF-8'); ?>" required>
                    </label>

                    <label class="admin-form-grid__full">
                        <span>Solution</span>
                        <input type="text" name="solution" value="<?php echo htmlspecialchars((string) ($selectedAd['solution'] ?? ''), ENT_QUOTES, 'UTF-8'); ?>" required>
                    </label>

                    <label class="admin-form-grid__full">
                        <span>Offer</span>
                        <input type="text" name="offer" value="<?php echo htmlspecialchars((string) ($selectedAd['offer'] ?? ''), ENT_QUOTES, 'UTF-8'); ?>" required>
                    </label>

                    <label>
                        <span>CTA label</span>
                        <input type="text" name="cta_label" value="<?php echo htmlspecialchars((string) ($selectedAd['cta_label'] ?? ''), ENT_QUOTES, 'UTF-8'); ?>" required>
                    </label>

                    <label>
                        <span>CTA href</span>
                        <input type="text" name="cta_href" value="<?php echo htmlspecialchars((string) ($selectedAd['cta_href'] ?? ''), ENT_QUOTES, 'UTF-8'); ?>" placeholder="Leave blank to use SMS link">
                    </label>

                    <label>
                        <span>Image path</span>
                        <input type="text" name="image_src" value="<?php echo htmlspecialchars($selectedImageSrc, ENT_QUOTES, 'UTF-8'); ?>" data-ad-image-input="src">
                    </label>

                    <label>
                        <span>Image alt</span>
                        <input type="text" name="image_alt" value="<?php echo htmlspecialchars($selectedImageAlt, ENT_QUOTES, 'UTF-8'); ?>" data-ad-image-input="alt">
                    </label>

                    <div class="admin-form-grid__full admin-ads-selected-image<?php echo $selectedImageSrc === '' ? ' is-empty' : ''; ?>" data-ad-image-preview>
                        <div class="admin-ads-selected-image__thumb">
                            <img src="<?php echo htmlspecialchars($selectedImageSrc, ENT_QUOTES, 'UTF-8'); ?>" alt="<?php echo htmlspecialchars($selectedImageAlt !== '' ? $selectedImageAlt : 'Selected ad image', ENT_QUOTES, 'UTF-8'); ?>"<?php echo $selectedImageSrc === '' ? ' hidden' : ''; ?> data-ad-image-preview-image>
                            <span<?php echo $selectedImageSrc !== '' ? ' hidden' : ''; ?> data-ad-image-preview-empty>No image selected yet.</span>
                        </div>
                        <div class="admin-ads-selected-image__body">
                            <strong>Selected image</strong>
                            <span data-ad-image-preview-path><?php echo htmlspecialchars($selectedImageSrc !== '' ? $selectedImageSrc : 'Choose an uploaded image or enter a path.', ENT_QUOTES, 'UTF-8'); ?></span>
                        </div>
                    </div>
                </div>

                <div class="admin-modal__footer">
                    <div class="admin-ads-editor-meta">
                        <span class="admin-badge<?php echo !empty($selectedAd['is_default']) ? ' admin-badge--accent' : ''; ?>"><?php echo !empty($selectedAd['is_default']) ? 'Default row' : 'Custom row'; ?></span>
                        <button type="button" class="btn btn--secondary" data-modal-open="images">Choose or Upload Image</button>
                    </div>
                    <div class="admin-form-actions">
                        <button type="submit" class="btn">Save Ad</button>
                        <?php if (!empty($selectedAd['id']) && empty($selectedAd['is_default'])): ?>
                            <button type="submit" class="btn btn--danger" name="action" value="delete" onclick="return confirm('Delete this ad?');">Delete</button>
                        <?php endif; ?>
                    </div>
                </div>
            </form>
        </div>
    </section>

    <section class="admin-modal" data-admin-modal="images"<?php echo $isImagesModalOpen ? '' : ' hidden'; ?>>
        <div class="admin-modal__backdrop" data-modal-close></div>
        <div class="admin-modal__dialog card admin-modal__dialog--wide" role="dialog" aria-modal="true" aria-labelledby="imageLibraryTitle">
            <div class="admin-modal__header">
                <div>
                    <p class="admin-page-eyebrow">Image Library</p>
                    <h2 id="imageLibraryTitle">Upload, tag, and pick images</h2>
                </div>
                <div class="admin-modal__header-actions">
                    <button type="button" class="btn btn--secondary" data-modal-switch="ad">Back to Editor</button>
                    <button type="button" class="admin-modal__close" data-modal-close aria-label="Close image library">X</button>
                </div>
            </div>

            <div class="admin-modal__body admin-image-library-modal">
                <section class="admin-image-upload-card">
                    <div class="admin-section-heading admin-section-heading--table">
                        <div>
                            <h3>Upload Image</h3>
                            <p class="admin-section-caption">Add multiple tags from the set list and append new tags when needed.</p>
                        </div>
                    </div>

                    <form method="post" enctype="multipart/form-data" class="admin-form admin-form--stacked admin-image-upload-form">
                        <input type="hidden" name="csrf_token" value="<?php echo htmlspecialchars((string) ($_SESSION['csrf_token'] ?? ''), ENT_QUOTES, 'UTF-8'); ?>">
                        <input type="hidden" name="action" value="upload_image">
                        <input type="hidden" name="group_key" value="<?php echo htmlspecialchars($selectedGroupKey, ENT_QUOTES, 'UTF-8'); ?>">
                        <input type="hidden" name="id" value="<?php echo htmlspecialchars((string) ($selectedAd['id'] ?? ''), ENT_QUOTES, 'UTF-8'); ?>">

                        <div class="admin-form-grid">
                            <label class="admin-form-grid__full">
                                <span>Image file</span>
                                <div class="admin-file-input-shell">
                                    <span data-upload-file-name>Select a JPG, PNG, WEBP, or GIF</span>
                                    <input type="file" name="image_file" accept="image/jpeg,image/png,image/webp,image/gif" required data-upload-file-input>
                                </div>
                            </label>

                            <label class="admin-form-grid__full">
                                <span>Image alt text</span>
                                <input type="text" name="image_alt" placeholder="Describe what the image shows">
                            </label>

                            <label class="admin-form-grid__full">
                                <span>Set tags</span>
                                <select name="selected_tags[]" multiple size="8">
                                    <?php foreach ($imageTagCatalog as $tag): ?>
                                        <option value="<?php echo htmlspecialchars($tag, ENT_QUOTES, 'UTF-8'); ?>"><?php echo htmlspecialchars(format_image_library_tag_label($tag), ENT_QUOTES, 'UTF-8'); ?></option>
                                    <?php endforeach; ?>
                                </select>
                                <small class="admin-field-caption">Use Cmd or Ctrl to choose multiple tags from the current catalog.</small>
                            </label>

                            <label class="admin-form-grid__full">
                                <span>Add new tags</span>
                                <input type="text" name="custom_tags" placeholder="seasonal, patio, remodel">
                                <small class="admin-field-caption">New tags are added to the shared tag catalog for future filtering.</small>
                            </label>
                        </div>

                        <div class="admin-form-actions">
                            <button type="submit" class="btn">Upload Image</button>
                        </div>
                    </form>
                </section>

                <section class="admin-image-library-card">
                    <div class="admin-section-heading admin-section-heading--table">
                        <div>
                            <h3>Filterable Library</h3>
                            <p class="admin-section-caption">Filter by one or more tags, then push an image back into the ad editor.</p>
                        </div>
                        <button type="button" class="btn btn--secondary" data-clear-image-filters>Clear Filters</button>
                    </div>

                    <?php if (!empty($imageTagCatalog)): ?>
                        <div class="admin-image-library__filters" data-image-filters>
                            <?php foreach ($imageTagCatalog as $tag): ?>
                                <label class="admin-tag-filter">
                                    <input type="checkbox" value="<?php echo htmlspecialchars($tag, ENT_QUOTES, 'UTF-8'); ?>" data-image-filter-control>
                                    <span><?php echo htmlspecialchars(format_image_library_tag_label($tag), ENT_QUOTES, 'UTF-8'); ?></span>
                                </label>
                            <?php endforeach; ?>
                        </div>
                    <?php endif; ?>

                    <?php if (!empty($imageLibraryImages)): ?>
                        <div class="admin-image-library__grid" data-image-library-grid>
                            <?php foreach ($imageLibraryImages as $imageRecord): ?>
                                <?php
                                $imageRecordSrc = trim((string) ($imageRecord['src'] ?? ''));
                                $imageRecordAlt = trim((string) ($imageRecord['alt'] ?? ''));
                                $imageTags = is_array($imageRecord['tags'] ?? null) ? $imageRecord['tags'] : [];
                                $isSelectedImage = $selectedImageSrc !== '' && $selectedImageSrc === $imageRecordSrc;
                                ?>
                                <article class="admin-image-card<?php echo $isSelectedImage ? ' is-selected' : ''; ?>" data-image-card data-image-src="<?php echo htmlspecialchars($imageRecordSrc, ENT_QUOTES, 'UTF-8'); ?>" data-image-tags="<?php echo htmlspecialchars(implode(',', $imageTags), ENT_QUOTES, 'UTF-8'); ?>">
                                    <div class="admin-image-card__media">
                                        <img src="<?php echo htmlspecialchars($imageRecordSrc, ENT_QUOTES, 'UTF-8'); ?>" alt="<?php echo htmlspecialchars($imageRecordAlt !== '' ? $imageRecordAlt : 'Library image', ENT_QUOTES, 'UTF-8'); ?>">
                                    </div>
                                    <div class="admin-image-card__body">
                                        <strong><?php echo htmlspecialchars($imageRecordAlt !== '' ? $imageRecordAlt : (string) ($imageRecord['original_name'] ?? 'Uploaded image'), ENT_QUOTES, 'UTF-8'); ?></strong>
                                        <span class="admin-image-card__meta"><?php echo htmlspecialchars((string) ($imageRecord['uploaded_at'] ?? ''), ENT_QUOTES, 'UTF-8'); ?></span>
                                        <?php if (!empty($imageTags)): ?>
                                            <div class="admin-image-card__tags">
                                                <?php foreach ($imageTags as $tag): ?>
                                                    <span class="admin-badge admin-badge--status admin-badge--status-draft"><?php echo htmlspecialchars(format_image_library_tag_label($tag), ENT_QUOTES, 'UTF-8'); ?></span>
                                                <?php endforeach; ?>
                                            </div>
                                        <?php endif; ?>
                                        <button type="button" class="btn btn--secondary" data-image-choice data-image-src="<?php echo htmlspecialchars($imageRecordSrc, ENT_QUOTES, 'UTF-8'); ?>" data-image-alt="<?php echo htmlspecialchars($imageRecordAlt, ENT_QUOTES, 'UTF-8'); ?>">Use Image</button>
                                    </div>
                                </article>
                            <?php endforeach; ?>
                        </div>
                        <p class="admin-image-library__empty" data-image-library-empty hidden>No images match the selected tags.</p>
                    <?php else: ?>
                        <p class="admin-section-caption">The library is empty. Upload the first image and tag it so it can be filtered later.</p>
                    <?php endif; ?>
                </section>
            </div>
        </div>
    </section>
</main>