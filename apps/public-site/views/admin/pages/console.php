<?php
$activeModalId = trim((string) ($activeModal ?? ''));
$integrationFormRecord = build_posted_integration_form_record($_POST ?? [], $errorMessage ?? null);
$imageEditRecord = build_posted_image_edit_record($_POST ?? [], $errorMessage ?? null);
$recordEditorState = build_posted_admin_console_record_editor_state($_POST ?? [], $errorMessage ?? null);
if (($recordEditorState['feature_key'] ?? '') === '') {
    $recordEditorState = build_requested_admin_console_record_editor_state($_GET ?? []);
}

function render_admin_console_badge(string $label, string $tone = 'default'): void {
    ?>
    <span class="admin-badge admin-badge--small admin-console-badge admin-console-badge--<?php echo htmlspecialchars($tone, ENT_QUOTES, 'UTF-8'); ?>"><?php echo htmlspecialchars($label, ENT_QUOTES, 'UTF-8'); ?></span>
    <?php
}

function get_admin_console_row_title(array $row): string {
    $title = trim((string) ($row['title'] ?? ''));
    if ($title !== '') {
        return $title;
    }

    return trim((string) ($row['id'] ?? 'Record'));
}

function get_admin_console_row_meta(array $row): array {
    $meta = [];
    foreach ($row as $column => $value) {
        if (in_array($column, ['id', 'title', 'status'], true)) {
            continue;
        }

        $formatted = format_admin_console_cell_value((string) $column, $value);
        if ($formatted === '') {
            continue;
        }

        $meta[] = format_admin_console_column_label((string) $column) . ': ' . $formatted;
    }

    return array_slice($meta, 0, 3);
}

function render_admin_console_record_actions(array $row, string $featureKey, string $sourceModalId = ''): void {
    $status = strtolower(trim((string) ($row['status'] ?? 'default')));
    ?>
    <div class="admin-console-record-actions">
        <span class="admin-console-status-light admin-console-status-light--<?php echo htmlspecialchars($status !== '' ? $status : 'default', ENT_QUOTES, 'UTF-8'); ?>" aria-hidden="true"></span>
        <button class="btn btn--secondary admin-console-record-action" type="button" data-console-record-open data-console-record-feature="<?php echo htmlspecialchars($featureKey, ENT_QUOTES, 'UTF-8'); ?>" data-console-record-source-modal="<?php echo htmlspecialchars($sourceModalId !== '' ? $sourceModalId : $featureKey, ENT_QUOTES, 'UTF-8'); ?>" data-record-id="<?php echo htmlspecialchars((string) ($row['id'] ?? ''), ENT_QUOTES, 'UTF-8'); ?>">Edit</button>
    </div>
    <?php
}

function render_admin_console_record_editor_fields(array $fields, bool $editable): void {
    foreach ($fields as $field):
        $fieldName = (string) ($field['name'] ?? '');
        if ($fieldName === '') {
            continue;
        }

        $fieldType = (string) ($field['type'] ?? 'text');
        $fieldLabel = (string) ($field['label'] ?? $fieldName);
        $fieldValue = (string) ($field['value'] ?? '');
        $fieldStep = (string) ($field['step'] ?? '1');
        ?>
        <label>
            <span><?php echo htmlspecialchars($fieldLabel, ENT_QUOTES, 'UTF-8'); ?></span>
            <input
                type="<?php echo htmlspecialchars($fieldType, ENT_QUOTES, 'UTF-8'); ?>"
                name="record[<?php echo htmlspecialchars($fieldName, ENT_QUOTES, 'UTF-8'); ?>]"
                value="<?php echo htmlspecialchars($fieldValue, ENT_QUOTES, 'UTF-8'); ?>"
                <?php if ($fieldType === 'number'): ?>step="<?php echo htmlspecialchars($fieldStep, ENT_QUOTES, 'UTF-8'); ?>"<?php endif; ?>
                <?php echo $editable ? '' : ' disabled'; ?>
            >
        </label>
    <?php
    endforeach;
}

function render_admin_console_image_tag_selector(string $scope, array $tags, string $placeholder = 'Search tags', string $selectName = '', array $selectedTags = []): void {
    ?>
    <div class="admin-console-filter-bar admin-console-filter-bar--image-tags" data-image-tag-root="<?php echo htmlspecialchars($scope, ENT_QUOTES, 'UTF-8'); ?>">
        <div class="admin-console-filter-shell">
            <div class="admin-console-filter-shell__label">
                <input
                    class="admin-console-filter-input"
                    type="search"
                    autocomplete="off"
                    spellcheck="false"
                    placeholder="<?php echo htmlspecialchars($placeholder, ENT_QUOTES, 'UTF-8'); ?>"
                    data-image-tag-search="<?php echo htmlspecialchars($scope, ENT_QUOTES, 'UTF-8'); ?>"
                    aria-expanded="false"
                    aria-controls="imageTagDropdown-<?php echo htmlspecialchars($scope, ENT_QUOTES, 'UTF-8'); ?>"
                >
            </div>
            <span class="admin-console-filter-shell__icon" aria-hidden="true">Search</span>
        </div>

        <div class="admin-console-selected-tags" data-image-selected-tags="<?php echo htmlspecialchars($scope, ENT_QUOTES, 'UTF-8'); ?>"></div>

        <div
            class="admin-console-filter-dropdown"
            id="imageTagDropdown-<?php echo htmlspecialchars($scope, ENT_QUOTES, 'UTF-8'); ?>"
            data-image-tag-dropdown="<?php echo htmlspecialchars($scope, ENT_QUOTES, 'UTF-8'); ?>"
            hidden
        >
            <div class="admin-console-filter-options admin-console-tag-options" data-image-tag-options="<?php echo htmlspecialchars($scope, ENT_QUOTES, 'UTF-8'); ?>">
                <?php foreach ($tags as $tag): ?>
                    <button class="admin-console-filter-option admin-console-tag-option" type="button" data-image-tag-toggle="<?php echo htmlspecialchars($scope, ENT_QUOTES, 'UTF-8'); ?>" data-tag-value="<?php echo htmlspecialchars($tag, ENT_QUOTES, 'UTF-8'); ?>">
                        <span class="admin-console-filter-option__group">Tags</span>
                        <span class="admin-console-filter-option__text"><?php echo htmlspecialchars(format_image_library_tag_label($tag), ENT_QUOTES, 'UTF-8'); ?></span>
                    </button>
                <?php endforeach; ?>
            </div>
        </div>

        <select<?php echo $selectName !== '' ? ' name="' . htmlspecialchars($selectName, ENT_QUOTES, 'UTF-8') . '"' : ''; ?> multiple hidden data-image-tag-select="<?php echo htmlspecialchars($scope, ENT_QUOTES, 'UTF-8'); ?>">
            <?php foreach ($tags as $tag): ?>
                <option value="<?php echo htmlspecialchars($tag, ENT_QUOTES, 'UTF-8'); ?>"<?php echo in_array($tag, $selectedTags, true) ? ' selected' : ''; ?>><?php echo htmlspecialchars(format_image_library_tag_label($tag), ENT_QUOTES, 'UTF-8'); ?></option>
            <?php endforeach; ?>
        </select>
    </div>
    <?php
}

function get_admin_console_integration_meta(array $record): array {
    $meta = [];

    $service = trim((string) ($record['service_label'] ?? ''));
    if ($service !== '') {
        $meta[] = 'Service: ' . $service;
    }

    $summary = trim((string) ($record['summary'] ?? ''));
    if ($summary !== '') {
        $meta[] = 'Summary: ' . $summary;
    }

    $updatedAt = format_admin_console_cell_value('updated_at', $record['updated_at'] ?? '');
    if ($updatedAt !== '') {
        $meta[] = 'Updated: ' . $updatedAt;
    }

    return $meta;
}

function render_admin_console_integration_actions(array $record): void {
    $recordPayload = trim((string) ($record['data_json'] ?? ''));
    ?>
    <div class="admin-console-record-actions">
        <button
            class="btn btn--secondary admin-console-record-action"
            type="button"
            data-integration-edit
            data-id="<?php echo htmlspecialchars((string) ($record['id'] ?? ''), ENT_QUOTES, 'UTF-8'); ?>"
            data-name="<?php echo htmlspecialchars((string) ($record['name'] ?? ''), ENT_QUOTES, 'UTF-8'); ?>"
            data-service="<?php echo htmlspecialchars((string) ($record['service_key'] ?? ''), ENT_QUOTES, 'UTF-8'); ?>"
            data-type="<?php echo htmlspecialchars((string) ($record['type_key'] ?? ''), ENT_QUOTES, 'UTF-8'); ?>"
            data-json="<?php echo htmlspecialchars($recordPayload, ENT_QUOTES, 'UTF-8'); ?>"
        >Edit</button>
        <form method="post" onsubmit="return confirm('Delete this integration?');">
            <input type="hidden" name="csrf_token" value="<?php echo htmlspecialchars((string) ($_SESSION['csrf_token'] ?? ''), ENT_QUOTES, 'UTF-8'); ?>">
            <input type="hidden" name="action" value="delete_integration">
            <input type="hidden" name="id" value="<?php echo htmlspecialchars((string) ($record['id'] ?? ''), ENT_QUOTES, 'UTF-8'); ?>">
            <button class="btn btn--danger admin-console-record-action" type="submit">Delete</button>
        </form>
    </div>
    <?php
}

function render_admin_console_feature_action_button(array $action, string $viewType = ''): void {
    $label = trim((string) ($action['label'] ?? 'Open'));
    $variant = trim((string) ($action['variant'] ?? 'primary'));
    $buttonClass = 'btn' . ($variant === 'secondary' ? ' btn--secondary' : '');
    $href = trim((string) ($action['href'] ?? ''));
    $modal = trim((string) ($action['modal'] ?? ''));
    $filter = trim((string) ($action['filter'] ?? ''));
    ?>
    <button
        class="<?php echo htmlspecialchars($buttonClass, ENT_QUOTES, 'UTF-8'); ?>"
        type="button"
        <?php if ($modal !== ''): ?>data-console-modal-open="<?php echo htmlspecialchars($modal, ENT_QUOTES, 'UTF-8'); ?>"<?php endif; ?>
        <?php if ($href !== ''): ?>data-feature-href="<?php echo htmlspecialchars($href, ENT_QUOTES, 'UTF-8'); ?>"<?php endif; ?>
        <?php if ($filter !== ''): ?>data-pay-filter="<?php echo htmlspecialchars($filter, ENT_QUOTES, 'UTF-8'); ?>"<?php endif; ?>
    ><?php echo htmlspecialchars($label, ENT_QUOTES, 'UTF-8'); ?></button>
    <?php
}

function render_admin_console_feature_body(array $feature): void {
    $bodyType = trim((string) ($feature['body_type'] ?? ''));

    if ($bodyType === 'metric' && !empty($feature['profit_card'])) {
        $tone = trim((string) ($feature['profit_card']['tone'] ?? 'positive'));
        ?>
        <p class="feature-card-value feature-card-value--<?php echo htmlspecialchars($tone, ENT_QUOTES, 'UTF-8'); ?>"><?php echo htmlspecialchars(format_admin_console_cell_value('amount', (string) ($feature['profit_card']['value'] ?? 0)), ENT_QUOTES, 'UTF-8'); ?></p>
        <?php
        return;
    }

    if ($bodyType === 'integration-stats' && !empty($feature['integration_summary'])) {
        $summary = $feature['integration_summary'];
        ?>
        <dl class="feature-card-stats">
            <div>
                <dt>Total</dt>
                <dd><?php echo htmlspecialchars((string) ($summary['total_integrations'] ?? 0), ENT_QUOTES, 'UTF-8'); ?></dd>
            </div>
            <div>
                <dt>Services</dt>
                <dd><?php echo htmlspecialchars((string) ($summary['services_in_use'] ?? 0), ENT_QUOTES, 'UTF-8'); ?></dd>
            </div>
            <div>
                <dt>Types</dt>
                <dd><?php echo htmlspecialchars((string) ($summary['types_in_use'] ?? 0), ENT_QUOTES, 'UTF-8'); ?></dd>
            </div>
        </dl>
        <?php
    }
}

function normalize_admin_console_filter_token(string $value): string {
    $value = strtolower(trim($value));
    $value = preg_replace('/[^a-z0-9]+/', '-', $value) ?? '';
    return trim($value, '-');
}

function get_admin_console_filter_group(string $column): string {
    $normalized = strtolower(trim($column));

    if ($normalized === 'status') {
        return 'Statuses';
    }

    if (in_array($normalized, ['service', 'service_key', 'service_label'], true)) {
        return 'Services';
    }

    if (in_array($normalized, ['category', 'categories'], true)) {
        return 'Categories';
    }

    if (in_array($normalized, ['tag', 'tags'], true)) {
        return 'Tags';
    }

    if (preg_match('/seo|keyword|keywords|meta|slug/', $normalized) === 1) {
        return 'SEO Words';
    }

    return format_admin_console_column_label($column);
}

function build_admin_console_seo_keywords(array $row): array {
    $sources = [];
    foreach (['title', 'path', 'service', 'service_label', 'category', 'tags'] as $column) {
        if (!array_key_exists($column, $row)) {
            continue;
        }

        $value = $row[$column];
        if (is_array($value)) {
            $sources[] = implode(' ', array_map('strval', $value));
            continue;
        }

        $sources[] = (string) $value;
    }

    $combined = strtolower(implode(' ', $sources));
    $parts = preg_split('/[^a-z0-9]+/', $combined) ?: [];
    $stopWords = ['and', 'the', 'for', 'with', 'from', 'that', 'this', 'your', 'when', 'into', 'page', 'rows', 'all'];
    $keywords = [];

    foreach ($parts as $part) {
        $part = trim($part);
        if ($part === '' || strlen($part) < 4 || in_array($part, $stopWords, true) || ctype_digit($part)) {
            continue;
        }

        $keywords[] = $part;
    }

    return array_values(array_unique($keywords));
}

function build_admin_console_filter_options(array $rows): array {
    $groupedOptions = [];

    foreach ($rows as $row) {
        $status = strtolower(trim((string) ($row['status'] ?? '')));
        if ($status !== '') {
            $groupedOptions['Statuses']['status:' . $status] = [
                'key' => 'status:' . $status,
                'group' => 'Statuses',
                'label' => format_admin_console_cell_value('status', $row['status'] ?? ''),
            ];
        }

        foreach ($row as $column => $value) {
            if (in_array($column, ['id', 'title', 'status'], true)) {
                continue;
            }

            if (is_array($value)) {
                foreach ($value as $item) {
                    $normalized = normalize_admin_console_filter_token((string) $item);
                    if ($normalized === '') {
                        continue;
                    }

                    $group = get_admin_console_filter_group((string) $column);
                    $groupedOptions[$group][$column . ':' . $normalized] = [
                        'key' => $column . ':' . $normalized,
                        'group' => $group,
                        'label' => trim((string) $item),
                    ];
                }

                continue;
            }

            $normalized = normalize_admin_console_filter_token((string) $value);
            if ($normalized === '') {
                continue;
            }

            $group = get_admin_console_filter_group((string) $column);
            $groupedOptions[$group][$column . ':' . $normalized] = [
                'key' => $column . ':' . $normalized,
                'group' => $group,
                'label' => format_admin_console_cell_value((string) $column, $value),
            ];
        }

        foreach (build_admin_console_seo_keywords($row) as $keyword) {
            $groupedOptions['SEO Words']['seo:' . $keyword] = [
                'key' => 'seo:' . $keyword,
                'group' => 'SEO Words',
                'label' => ucwords(str_replace('-', ' ', $keyword)),
            ];
        }
    }

    $orderedGroups = ['Statuses', 'Services', 'Categories', 'Tags', 'SEO Words'];
    $result = [];

    foreach ($orderedGroups as $groupName) {
        if (!isset($groupedOptions[$groupName])) {
            continue;
        }

        uasort($groupedOptions[$groupName], static function (array $left, array $right): int {
            return strcasecmp((string) ($left['label'] ?? ''), (string) ($right['label'] ?? ''));
        });

        $result[] = ['group' => $groupName, 'options' => array_values($groupedOptions[$groupName])];
        unset($groupedOptions[$groupName]);
    }

    ksort($groupedOptions);
    foreach ($groupedOptions as $groupName => $options) {
        uasort($options, static function (array $left, array $right): int {
            return strcasecmp((string) ($left['label'] ?? ''), (string) ($right['label'] ?? ''));
        });
        $result[] = ['group' => (string) $groupName, 'options' => array_values($options)];
    }

    return $result;
}

function flatten_admin_console_filter_options(array $groups): array {
    $options = [];

    foreach ($groups as $group) {
        $groupOptions = isset($group['options']) && is_array($group['options']) ? $group['options'] : [];
        foreach ($groupOptions as $option) {
            $options[] = $option;
        }
    }

    return $options;
}

function build_admin_console_row_filter_tokens(array $row): array {
    $tokens = [];

    $status = strtolower(trim((string) ($row['status'] ?? '')));
    if ($status !== '') {
        $tokens[] = 'status:' . $status;
    }

    foreach ($row as $column => $value) {
        if (in_array($column, ['id', 'title', 'status'], true)) {
            continue;
        }

        if (is_array($value)) {
            foreach ($value as $item) {
                $normalized = strtolower(trim((string) $item));
                if ($normalized !== '') {
                    $tokens[] = $column . ':' . $normalized;
                }
            }

            continue;
        }

        $normalized = normalize_admin_console_filter_token((string) $value);
        if ($normalized !== '') {
            $tokens[] = $column . ':' . $normalized;
        }
    }

    foreach (build_admin_console_seo_keywords($row) as $keyword) {
        $tokens[] = 'seo:' . $keyword;
    }

    return array_values(array_unique($tokens));
}

function render_admin_console_table(array $rows, string $featureKey, $limit = 'all', string $sourceModalId = ''): void {
    $visibleRows = $limit === 'all' ? $rows : array_slice($rows, 0, (int) $limit);
    $filterGroups = build_admin_console_filter_options($visibleRows);
    $filterOptions = flatten_admin_console_filter_options($filterGroups);
    $resolvedSourceModalId = $sourceModalId !== '' ? $sourceModalId : $featureKey;
    ?>
    <div class="admin-console-filter-bar" data-console-filter="<?php echo htmlspecialchars($featureKey, ENT_QUOTES, 'UTF-8'); ?>">
        <div class="admin-console-filter-shell">
            <div class="admin-console-filter-shell__label">
                <input
                    class="admin-console-filter-input"
                    type="search"
                    autocomplete="off"
                    spellcheck="false"
                    placeholder="Search statuses, tags, categories, services, or SEO words"
                    data-console-filter-input="<?php echo htmlspecialchars($featureKey, ENT_QUOTES, 'UTF-8'); ?>"
                    aria-expanded="false"
                    aria-controls="consoleFilterDropdown-<?php echo htmlspecialchars($featureKey, ENT_QUOTES, 'UTF-8'); ?>"
                >
            </div>
            <span class="admin-console-filter-shell__icon" aria-hidden="true">Search</span>
        </div>

        <div class="admin-console-filter-badge-row" data-console-filter-badges="<?php echo htmlspecialchars($featureKey, ENT_QUOTES, 'UTF-8'); ?>" hidden></div>

        <div
            class="admin-console-filter-dropdown"
            id="consoleFilterDropdown-<?php echo htmlspecialchars($featureKey, ENT_QUOTES, 'UTF-8'); ?>"
            data-console-filter-dropdown="<?php echo htmlspecialchars($featureKey, ENT_QUOTES, 'UTF-8'); ?>"
            hidden
        >
            <div class="admin-console-filter-options" data-console-filter-options="<?php echo htmlspecialchars($featureKey, ENT_QUOTES, 'UTF-8'); ?>">
                <?php foreach ($filterOptions as $option): ?>
                    <button
                        class="admin-console-filter-option"
                        type="button"
                        data-console-filter-option
                        data-filter-key="<?php echo htmlspecialchars((string) ($option['key'] ?? ''), ENT_QUOTES, 'UTF-8'); ?>"
                        data-filter-group="<?php echo htmlspecialchars((string) ($option['group'] ?? ''), ENT_QUOTES, 'UTF-8'); ?>"
                        data-filter-label="<?php echo htmlspecialchars((string) ($option['label'] ?? ''), ENT_QUOTES, 'UTF-8'); ?>"
                    >
                        <span class="admin-console-filter-option__group"><?php echo htmlspecialchars((string) ($option['group'] ?? ''), ENT_QUOTES, 'UTF-8'); ?></span>
                        <span class="admin-console-filter-option__text"><?php echo htmlspecialchars((string) ($option['label'] ?? ''), ENT_QUOTES, 'UTF-8'); ?></span>
                    </button>
                <?php endforeach; ?>
            </div>
        </div>
    </div>

    <div class="admin-console-record-list" data-console-table="<?php echo htmlspecialchars($featureKey, ENT_QUOTES, 'UTF-8'); ?>">
        <?php foreach ($visibleRows as $row): ?>
            <?php
            $searchIndex = strtolower(implode(' ', array_map(static function ($value): string {
                if (is_array($value)) {
                    return implode(' ', array_map('strval', $value));
                }

                return (string) $value;
            }, $row)));
            $rowStatus = strtolower(trim((string) ($row['status'] ?? '')));
            $rowMeta = get_admin_console_row_meta($row);
            $rowFilters = build_admin_console_row_filter_tokens($row);
            $editorState = build_admin_console_record_editor_state_from_row($featureKey, $row);
            ?>
            <article class="admin-console-record-row" data-console-row data-console-record-open data-console-record-feature="<?php echo htmlspecialchars($featureKey, ENT_QUOTES, 'UTF-8'); ?>" data-console-record-source-modal="<?php echo htmlspecialchars($resolvedSourceModalId, ENT_QUOTES, 'UTF-8'); ?>" data-console-record-title="<?php echo htmlspecialchars((string) ($editorState['title'] ?? 'Edit Record'), ENT_QUOTES, 'UTF-8'); ?>" data-console-record-editable="<?php echo !empty($editorState['editable']) ? '1' : '0'; ?>" data-console-record-fields="<?php echo htmlspecialchars((string) json_encode($editorState['fields'] ?? [], JSON_UNESCAPED_SLASHES), ENT_QUOTES, 'UTF-8'); ?>" data-record-id="<?php echo htmlspecialchars((string) ($row['id'] ?? ''), ENT_QUOTES, 'UTF-8'); ?>" data-search="<?php echo htmlspecialchars($searchIndex, ENT_QUOTES, 'UTF-8'); ?>" data-status="<?php echo htmlspecialchars($rowStatus, ENT_QUOTES, 'UTF-8'); ?>" data-filter-tokens="<?php echo htmlspecialchars((string) json_encode($rowFilters, JSON_UNESCAPED_SLASHES), ENT_QUOTES, 'UTF-8'); ?>" role="button" tabindex="0">
                <div class="admin-console-record-row__content">
                    <div class="admin-console-record-row__header">
                        <h3><?php echo htmlspecialchars(get_admin_console_row_title($row), ENT_QUOTES, 'UTF-8'); ?></h3>
                        <?php render_admin_console_badge(format_admin_console_cell_value('status', $row['status'] ?? ''), $rowStatus !== '' ? $rowStatus : 'default'); ?>
                    </div>
                    <?php if ($rowMeta !== []): ?>
                        <p class="admin-console-record-row__meta"><?php echo htmlspecialchars(implode(' | ', $rowMeta), ENT_QUOTES, 'UTF-8'); ?></p>
                    <?php endif; ?>
                </div>
                <?php render_admin_console_record_actions($row, $featureKey, $resolvedSourceModalId); ?>
            </article>
        <?php endforeach; ?>
    </div>
    <?php
}
?>
<main class="admin-main admin-main--console">
    <div class="wrapper admin-wrapper">
        <div class="admin-console-hero">
            <h1><?php echo htmlspecialchars((string) ($groupTitle ?? 'Console'), ENT_QUOTES, 'UTF-8'); ?></h1>
            <p class="admin-page-intro"><?php echo htmlspecialchars((string) ($groupIntro ?? ''), ENT_QUOTES, 'UTF-8'); ?></p>
        </div>

        <?php if ($noticeMessage !== null): ?>
            <section class="admin-alert admin-alert--success" aria-live="polite"><?php echo htmlspecialchars($noticeMessage, ENT_QUOTES, 'UTF-8'); ?></section>
        <?php endif; ?>

        <?php if ($errorMessage !== null): ?>
            <section class="admin-alert admin-alert--error" aria-live="assertive"><?php echo htmlspecialchars($errorMessage, ENT_QUOTES, 'UTF-8'); ?></section>
        <?php endif; ?>

        <section class="admin-console-stack">
            <?php foreach ($features as $feature): ?>
                <?php
                $featureKey = (string) ($feature['key'] ?? '');
                $cardType = trim((string) ($feature['card_type'] ?? 'single-action'));
                $featureTitle = (string) ($feature['title'] ?? $featureKey);
                $featureDescription = trim((string) ($feature['description'] ?? ''));
                $actions = isset($feature['actions']) && is_array($feature['actions']) ? $feature['actions'] : [];
                ?>
                <section class="card feature-card feature-card--<?php echo htmlspecialchars($cardType, ENT_QUOTES, 'UTF-8'); ?>" id="<?php echo htmlspecialchars($featureKey, ENT_QUOTES, 'UTF-8'); ?>">
                    <div class="header">
                        <p class="admin-card-eyebrow"><?php echo htmlspecialchars((string) ($groupTitle ?? 'Console'), ENT_QUOTES, 'UTF-8'); ?></p>
                        <h2><?php echo htmlspecialchars($featureTitle, ENT_QUOTES, 'UTF-8'); ?></h2>
                        <?php if ($featureDescription !== ''): ?>
                            <p class="admin-card-caption"><?php echo htmlspecialchars($featureDescription, ENT_QUOTES, 'UTF-8'); ?></p>
                        <?php endif; ?>
                    </div>

                    <?php render_admin_console_feature_body($feature); ?>

                    <?php if ($actions !== []): ?>
                        <div class="feature-card-footer">
                            <?php foreach ($actions as $action): ?>
                                <?php render_admin_console_feature_action_button($action, $cardType); ?>
                            <?php endforeach; ?>
                        </div>
                    <?php endif; ?>
                </section>
            <?php endforeach; ?>
        </section>
    </div>

    <?php foreach ($modals as $modalId => $modal): ?>
        <section
            class="admin-modal admin-console-modal"
            data-console-modal="<?php echo htmlspecialchars($modalId, ENT_QUOTES, 'UTF-8'); ?>"
            <?php if (($modal['type'] ?? '') === 'integrations-manager'): ?>
                data-integration-templates="<?php echo htmlspecialchars(json_encode($integrationTypeTemplates, JSON_UNESCAPED_SLASHES), ENT_QUOTES, 'UTF-8'); ?>"
                data-integration-help-text="<?php echo htmlspecialchars(json_encode($integrationTypeHelpText, JSON_UNESCAPED_SLASHES), ENT_QUOTES, 'UTF-8'); ?>"
            <?php endif; ?>
            <?php echo $activeModalId === $modalId ? '' : ' hidden'; ?>
        >
            <div class="admin-modal__backdrop" data-console-modal-close></div>
            <div class="admin-modal__dialog card" role="dialog" aria-modal="true" aria-labelledby="modalTitle-<?php echo htmlspecialchars($modalId, ENT_QUOTES, 'UTF-8'); ?>">
                <div class="admin-modal__header">
                    <div>
                        <p class="admin-page-eyebrow"><?php echo htmlspecialchars((string) ($groupTitle ?? 'Console'), ENT_QUOTES, 'UTF-8'); ?></p>
                        <h2 id="modalTitle-<?php echo htmlspecialchars($modalId, ENT_QUOTES, 'UTF-8'); ?>"><?php echo htmlspecialchars((string) (($modalId === 'record-editor' ? ($recordEditorState['title'] ?? null) : null) ?? ($modal['title'] ?? 'Modal')), ENT_QUOTES, 'UTF-8'); ?></h2>
                    </div>
                    <button class="admin-modal__close" type="button" data-console-modal-close aria-label="Close">X</button>
                </div>

                <div class="admin-modal__body admin-console-modal__body">
                    <?php if (($modal['type'] ?? '') === 'take-payment'): ?>
                        <?php $unpaidInvoices = get_unpaid_invoice_rows(); ?>
                        <form class="admin-form admin-form--stacked admin-console-image-form" method="post">
                            <input type="hidden" name="csrf_token" value="<?php echo htmlspecialchars((string) ($_SESSION['csrf_token'] ?? ''), ENT_QUOTES, 'UTF-8'); ?>">
                            <input type="hidden" name="action" value="take_invoice_payment">
                            <div class="admin-form-grid">
                                <label class="admin-form-grid__full">
                                    <span>Unpaid invoice</span>
                                    <select name="invoice_id" required>
                                        <option value="">Select an invoice</option>
                                        <?php foreach ($unpaidInvoices as $invoice): ?>
                                            <option value="<?php echo htmlspecialchars((string) ($invoice['id'] ?? ''), ENT_QUOTES, 'UTF-8'); ?>"><?php echo htmlspecialchars((string) (($invoice['id'] ?? '') . ' | ' . ($invoice['title'] ?? '') . ' | $' . number_format((float) ($invoice['amount'] ?? 0), 2)), ENT_QUOTES, 'UTF-8'); ?></option>
                                        <?php endforeach; ?>
                                    </select>
                                </label>
                                <label>
                                    <span>Amount</span>
                                    <input type="number" name="payment_amount" min="0" step="0.01" placeholder="Use invoice total">
                                </label>
                                <label>
                                    <span>Payment Method</span>
                                    <input type="text" name="payment_method" placeholder="Card, cash, check...">
                                </label>
                            </div>
                            <div class="admin-form-actions">
                                <button class="btn" type="submit">Take Payment</button>
                            </div>
                        </form>
                    <?php elseif (($modal['type'] ?? '') === 'mark-paid'): ?>
                        <?php $unpaidInvoices = get_unpaid_invoice_rows(); ?>
                        <section class="admin-console-transform-panel">
                            <div class="admin-section-heading admin-section-heading--table">
                                <div>
                                    <h3>Unpaid Invoices</h3>
                                    <p class="admin-section-caption">Choose an invoice to open a new journal entry in accounting and mark it paid when you save.</p>
                                </div>
                            </div>
                            <div class="admin-console-record-list">
                                <?php foreach ($unpaidInvoices as $invoice): ?>
                                    <a class="admin-console-record-row admin-console-record-row--link" href="accounting.php?modal=record-editor&amp;feature_key=journal&amp;source_modal_id=journal&amp;create=1&amp;invoice=<?php echo htmlspecialchars((string) ($invoice['id'] ?? ''), ENT_QUOTES, 'UTF-8'); ?>&amp;mark_invoice_paid=1">
                                        <div class="admin-console-record-row__content">
                                            <div class="admin-console-record-row__header">
                                                <h3><?php echo htmlspecialchars((string) ($invoice['title'] ?? 'Invoice'), ENT_QUOTES, 'UTF-8'); ?></h3>
                                                <?php render_admin_console_badge((string) ($invoice['status'] ?? 'sent'), (string) ($invoice['status'] ?? 'default')); ?>
                                            </div>
                                            <p class="admin-console-record-row__meta"><?php echo htmlspecialchars(implode(' | ', array_filter([
                                                (string) ($invoice['id'] ?? ''),
                                                (string) ($invoice['customer'] ?? ''),
                                                '$' . number_format((float) ($invoice['amount'] ?? 0), 2),
                                            ])), ENT_QUOTES, 'UTF-8'); ?></p>
                                        </div>
                                        <div class="admin-console-record-actions"><span class="btn btn--secondary admin-console-record-action">Open</span></div>
                                    </a>
                                <?php endforeach; ?>
                            </div>
                        </section>
                    <?php elseif (($modal['type'] ?? '') === 'gallery'): ?>
                        <section class="admin-console-gallery-shell">
                            <div class="admin-console-gallery-filter">
                                <?php render_admin_console_image_tag_selector('gallery', $imageLibraryTags, 'Search tags'); ?>
                            </div>

                            <div class="admin-console-gallery-grid admin-console-gallery-grid--compact">
                                <?php foreach ($imageLibraryImages as $image): ?>
                                    <?php $imageTags = isset($image['tags']) && is_array($image['tags']) ? implode(' ', $image['tags']) : ''; ?>
                                    <figure class="admin-console-gallery-card admin-console-gallery-card--bare" data-gallery-item data-tags="<?php echo htmlspecialchars($imageTags, ENT_QUOTES, 'UTF-8'); ?>">
                                        <button
                                            class="admin-console-gallery-thumb"
                                            type="button"
                                            data-carousel-open
                                            data-id="<?php echo htmlspecialchars((string) ($image['id'] ?? ''), ENT_QUOTES, 'UTF-8'); ?>"
                                            data-src="<?php echo htmlspecialchars((string) ($image['src'] ?? ''), ENT_QUOTES, 'UTF-8'); ?>"
                                            data-alt="<?php echo htmlspecialchars((string) ($image['alt'] ?? 'Library image'), ENT_QUOTES, 'UTF-8'); ?>"
                                            data-tags="<?php echo htmlspecialchars($imageTags, ENT_QUOTES, 'UTF-8'); ?>"
                                            data-visible-on-page="<?php echo htmlspecialchars((string) ($image['visible_on_page'] ?? ''), ENT_QUOTES, 'UTF-8'); ?>"
                                        >
                                            <img src="<?php echo htmlspecialchars((string) (($image['thumb_src'] ?? '') !== '' ? $image['thumb_src'] : ($image['src'] ?? '')), ENT_QUOTES, 'UTF-8'); ?>" alt="<?php echo htmlspecialchars((string) ($image['alt'] ?? 'Library image'), ENT_QUOTES, 'UTF-8'); ?>">
                                        </button>
                                    </figure>
                                <?php endforeach; ?>
                            </div>
                        </section>
                    <?php elseif (($modal['type'] ?? '') === 'image-upload'): ?>
                        <form class="admin-form admin-form--stacked admin-console-image-form" method="post" enctype="multipart/form-data">
                            <input type="hidden" name="csrf_token" value="<?php echo htmlspecialchars((string) ($_SESSION['csrf_token'] ?? ''), ENT_QUOTES, 'UTF-8'); ?>">
                            <input type="hidden" name="action" value="upload_image">
                            <div class="admin-console-tag-selector-shell">
                                <?php render_admin_console_image_tag_selector('upload', $imageLibraryTags, 'Search tags', 'selected_tags[]'); ?>
                            </div>
                            <div class="admin-form-grid">
                                <label class="admin-form-grid__full">
                                    <span>File Name Override</span>
                                    <input type="text" name="file_name_override" placeholder="Optional clean file name">
                                </label>
                                <label class="admin-form-grid__full admin-console-upload-field">
                                    <span>Image file</span>
                                    <label class="btn admin-console-upload-button" for="adminConsoleImageUploadInput" data-image-upload-trigger>
                                        <span data-image-upload-label>Choose images</span>
                                    </label>
                                    <input id="adminConsoleImageUploadInput" class="admin-console-upload-input" type="file" name="image_file[]" accept="image/*" multiple required data-image-upload-input>
                                </label>
                                <label>
                                    <span>Alt text</span>
                                    <input type="text" name="image_alt">
                                </label>
                                <label>
                                    <span>Custom tags</span>
                                    <input type="text" name="custom_tags" placeholder="Comma separated">
                                </label>
                            </div>
                            <div class="admin-form-actions">
                                <button class="btn" type="submit">Upload Image</button>
                            </div>
                        </form>
                    <?php elseif (($modal['type'] ?? '') === 'image-carousel'): ?>
                        <section class="admin-console-carousel" data-image-carousel>
                            <div class="admin-console-carousel__stage">
                                <button class="btn btn--secondary admin-console-carousel__nav" type="button" data-carousel-previous>Previous</button>
                                <figure class="admin-console-carousel__figure">
                                    <img src="" alt="" data-carousel-image>
                                    <figcaption>
                                        <strong data-carousel-caption></strong>
                                        <span data-carousel-meta></span>
                                    </figcaption>
                                </figure>
                                <button class="btn btn--secondary admin-console-carousel__nav" type="button" data-carousel-next>Next</button>
                            </div>
                            <div class="admin-console-action-row admin-console-carousel__actions">
                                <button class="btn" type="button" data-carousel-edit>Edit</button>
                                <button class="btn btn--secondary" type="button" data-console-modal-close>Close</button>
                            </div>
                        </section>
                    <?php elseif (($modal['type'] ?? '') === 'image-edit'): ?>
                        <form class="admin-form admin-form--stacked admin-console-image-form" method="post" data-image-edit-form>
                            <input type="hidden" name="csrf_token" value="<?php echo htmlspecialchars((string) ($_SESSION['csrf_token'] ?? ''), ENT_QUOTES, 'UTF-8'); ?>">
                            <input type="hidden" name="action" value="save_image_record">
                            <input type="hidden" name="id" value="<?php echo htmlspecialchars((string) ($imageEditRecord['id'] ?? ''), ENT_QUOTES, 'UTF-8'); ?>" data-image-edit-field="id">
                            <div class="admin-form-grid">
                                <label>
                                    <span>Alt text</span>
                                    <input type="text" name="alt" value="<?php echo htmlspecialchars((string) ($imageEditRecord['alt'] ?? ''), ENT_QUOTES, 'UTF-8'); ?>" data-image-edit-field="alt">
                                </label>
                                <label>
                                    <span>Visible On Page</span>
                                    <input type="text" name="visible_on_page" value="<?php echo htmlspecialchars((string) ($imageEditRecord['visible_on_page'] ?? ''), ENT_QUOTES, 'UTF-8'); ?>" data-image-edit-field="visible_on_page">
                                </label>
                                <label class="admin-form-grid__full">
                                    <span>Tags</span>
                                    <?php render_admin_console_image_tag_selector('edit', $imageLibraryTags, 'Search tags', 'selected_tags[]', $imageEditRecord['tags'] ?? []); ?>
                                </label>
                                <label class="admin-form-grid__full">
                                    <span>Custom tags</span>
                                    <input type="text" name="custom_tags" placeholder="Comma separated">
                                </label>
                            </div>
                            <div class="admin-form-actions">
                                <button class="btn" type="submit">Save Image</button>
                            </div>
                        </form>
                        <?php $activeImageRecord = get_image_library_image_by_id((string) ($imageEditRecord['id'] ?? '')); ?>
                        <?php if ($activeImageRecord !== null): ?>
                            <section class="admin-console-transform-panel">
                                <div class="admin-section-heading admin-section-heading--table">
                                    <div>
                                        <h3>Process Image</h3>
                                        <p class="admin-section-caption">Resize or convert the live library image and regenerate its thumbnail.</p>
                                    </div>
                                </div>
                                <form class="admin-form admin-form--stacked admin-console-image-form" method="post">
                                    <input type="hidden" name="csrf_token" value="<?php echo htmlspecialchars((string) ($_SESSION['csrf_token'] ?? ''), ENT_QUOTES, 'UTF-8'); ?>">
                                    <input type="hidden" name="action" value="process_image_asset">
                                    <input type="hidden" name="id" value="<?php echo htmlspecialchars((string) ($activeImageRecord['id'] ?? ''), ENT_QUOTES, 'UTF-8'); ?>">
                                    <div class="admin-form-grid">
                                        <label>
                                            <span>Format</span>
                                            <select name="variant_format">
                                                <option value="keep">Keep current</option>
                                                <option value="jpg">JPEG</option>
                                                <option value="png">PNG</option>
                                                <option value="webp">WEBP</option>
                                            </select>
                                        </label>
                                        <label>
                                            <span>Max width</span>
                                            <input type="number" name="variant_max_width" min="0" step="1" placeholder="1600">
                                        </label>
                                        <label>
                                            <span>Max height</span>
                                            <input type="number" name="variant_max_height" min="0" step="1" placeholder="0">
                                        </label>
                                    </div>
                                    <div class="admin-form-actions">
                                        <button class="btn btn--secondary" type="submit">Process Image</button>
                                    </div>
                                </form>
                            </section>
                        <?php endif; ?>
                    <?php elseif (($modal['type'] ?? '') === 'image-batch'): ?>
                        <section class="admin-console-transform-panel">
                            <div class="admin-section-heading admin-section-heading--table">
                                <div>
                                    <h3>Batch Image Tools</h3>
                                    <p class="admin-section-caption">Process the live library images matched by the selected tags.</p>
                                </div>
                            </div>
                            <form class="admin-form admin-form--stacked admin-console-image-form" method="post">
                                <input type="hidden" name="csrf_token" value="<?php echo htmlspecialchars((string) ($_SESSION['csrf_token'] ?? ''), ENT_QUOTES, 'UTF-8'); ?>">
                                <input type="hidden" name="action" value="batch_process_image_assets">
                                <?php render_admin_console_image_tag_selector('batch', $imageLibraryTags, 'Search tags', 'selected_tags[]', $imageBatchState['selected_tags'] ?? []); ?>
                                <div class="admin-form-grid">
                                    <label>
                                        <span>Format</span>
                                        <select name="batch_format">
                                            <option value="jpg"<?php echo ($imageBatchState['format'] ?? '') === 'jpg' ? ' selected' : ''; ?>>JPEG</option>
                                            <option value="png"<?php echo ($imageBatchState['format'] ?? '') === 'png' ? ' selected' : ''; ?>>PNG</option>
                                            <option value="webp"<?php echo ($imageBatchState['format'] ?? 'webp') === 'webp' ? ' selected' : ''; ?>>WEBP</option>
                                        </select>
                                    </label>
                                    <label>
                                        <span>Max width</span>
                                        <input type="number" name="batch_max_width" min="0" step="1" value="<?php echo htmlspecialchars((string) ($imageBatchState['max_width'] ?? '1600'), ENT_QUOTES, 'UTF-8'); ?>">
                                    </label>
                                    <label>
                                        <span>Max height</span>
                                        <input type="number" name="batch_max_height" min="0" step="1" value="<?php echo htmlspecialchars((string) ($imageBatchState['max_height'] ?? '0'), ENT_QUOTES, 'UTF-8'); ?>">
                                    </label>
                                    <label>
                                        <span>Additional tags</span>
                                        <input type="text" name="custom_tags" value="<?php echo htmlspecialchars((string) ($imageBatchState['custom_tags'] ?? ''), ENT_QUOTES, 'UTF-8'); ?>" placeholder="Comma separated">
                                    </label>
                                </div>
                                <div class="admin-form-actions">
                                    <button class="btn" type="submit">Run Batch</button>
                                </div>
                            </form>
                        </section>
                    <?php elseif (($modal['type'] ?? '') === 'submission-queue'): ?>
                        <section class="admin-console-transform-panel">
                            <div class="admin-section-heading admin-section-heading--table">
                                <div>
                                    <h3>Submission Queue</h3>
                                    <p class="admin-section-caption">Review front-end uploads before they enter the public library.</p>
                                </div>
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
                                                <p class="admin-console-record-row__meta"><?php echo htmlspecialchars(implode(' | ', array_filter([
                                                    (string) ($submission['email'] ?? ''),
                                                    (string) ($submission['phone'] ?? ''),
                                                    (string) ($submission['submitted_at'] ?? ''),
                                                    strtoupper((string) ($submission['extension'] ?? '')),
                                                ])), ENT_QUOTES, 'UTF-8'); ?></p>
                                                <?php if (trim((string) ($submission['notes'] ?? '')) !== ''): ?>
                                                    <p class="admin-console-record-row__meta"><?php echo htmlspecialchars((string) ($submission['notes'] ?? ''), ENT_QUOTES, 'UTF-8'); ?></p>
                                                <?php endif; ?>
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
                    <?php elseif (($modal['type'] ?? '') === 'create-user'): ?>
                        <form class="admin-form admin-form--stacked" method="post">
                            <input type="hidden" name="csrf_token" value="<?php echo htmlspecialchars((string) ($_SESSION['csrf_token'] ?? ''), ENT_QUOTES, 'UTF-8'); ?>">
                            <input type="hidden" name="action" value="create_user">
                            <div class="admin-form-grid">
                                <label>
                                    <span>Username</span>
                                    <input type="text" name="username" required>
                                </label>
                                <label>
                                    <span>Email</span>
                                    <input type="email" name="email" required>
                                </label>
                                <label>
                                    <span>Password</span>
                                    <input type="password" name="password" minlength="8" required>
                                </label>
                            </div>
                            <div class="admin-form-actions">
                                <button class="btn" type="submit">Create User</button>
                            </div>
                        </form>
                    <?php elseif (($modal['type'] ?? '') === 'table-with-upload'): ?>
                        <form class="admin-form admin-form--stacked" method="post" enctype="multipart/form-data">
                            <input type="hidden" name="csrf_token" value="<?php echo htmlspecialchars((string) ($_SESSION['csrf_token'] ?? ''), ENT_QUOTES, 'UTF-8'); ?>">
                            <input type="hidden" name="action" value="upload_banking_csv">
                            <div class="admin-form-grid">
                                <label>
                                    <span>CSV File</span>
                                    <input type="file" name="csv_file" accept=".csv,text/csv" required>
                                </label>
                            </div>
                            <div class="admin-form-actions">
                                <button class="btn" type="submit">Upload CSV</button>
                            </div>
                        </form>
                        <?php render_admin_console_table($modal['rows'] ?? [], 'banking-modal', 'all', 'banking'); ?>
                    <?php elseif (($modal['type'] ?? '') === 'selected-images'): ?>
                        <div class="admin-console-selected-images">
                            <?php foreach ($imageLibraryImages as $image): ?>
                                <article class="admin-console-selected-image-card">
                                    <img src="<?php echo htmlspecialchars((string) ($image['src'] ?? ''), ENT_QUOTES, 'UTF-8'); ?>" alt="<?php echo htmlspecialchars((string) ($image['alt'] ?? 'Library image'), ENT_QUOTES, 'UTF-8'); ?>">
                                    <div>
                                        <h3><?php echo htmlspecialchars((string) ($image['alt'] ?? 'Untitled image'), ENT_QUOTES, 'UTF-8'); ?></h3>
                                        <p>Source: <?php echo htmlspecialchars((string) ($image['src'] ?? ''), ENT_QUOTES, 'UTF-8'); ?></p>
                                        <p>Visible On Page: <?php echo htmlspecialchars(build_admin_console_image_visibility($image), ENT_QUOTES, 'UTF-8'); ?></p>
                                    </div>
                                </article>
                            <?php endforeach; ?>
                        </div>
                    <?php elseif (($modal['type'] ?? '') === 'integrations-manager'): ?>
                        <section class="admin-console-integrations-manager">
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
                                        <label>
                                            <span>Name</span>
                                            <input type="text" name="name" value="<?php echo htmlspecialchars((string) ($integrationFormRecord['name'] ?? ''), ENT_QUOTES, 'UTF-8'); ?>" data-integration-field="name" required>
                                        </label>
                                        <label>
                                            <span>Service</span>
                                            <select name="service_key" data-integration-field="service_key" data-integration-service-select>
                                                <?php foreach ($integrationServiceOptions as $serviceKey => $serviceLabel): ?>
                                                    <option value="<?php echo htmlspecialchars((string) $serviceKey, ENT_QUOTES, 'UTF-8'); ?>"<?php echo ($integrationFormRecord['service_key'] ?? '') === $serviceKey ? ' selected' : ''; ?>><?php echo htmlspecialchars((string) $serviceLabel, ENT_QUOTES, 'UTF-8'); ?></option>
                                                <?php endforeach; ?>
                                                <option value="__custom__"<?php echo ($integrationFormRecord['service_key'] ?? '') === '__custom__' ? ' selected' : ''; ?>>Add Service</option>
                                            </select>
                                        </label>
                                        <label class="admin-console-custom-service-field<?php echo ($integrationFormRecord['service_key'] ?? '') === '__custom__' ? '' : ' is-hidden'; ?>" data-integration-custom-service>
                                            <span>Add Service</span>
                                            <input type="text" name="custom_service_label" value="<?php echo htmlspecialchars((string) ($integrationFormRecord['custom_service_label'] ?? ''), ENT_QUOTES, 'UTF-8'); ?>" data-integration-field="custom_service_label">
                                        </label>
                                        <label>
                                            <span>Type</span>
                                            <select name="type_key" data-integration-field="type_key" data-integration-type-select>
                                                <?php foreach ($integrationTypeOptions as $typeKey => $typeLabel): ?>
                                                    <option value="<?php echo htmlspecialchars((string) $typeKey, ENT_QUOTES, 'UTF-8'); ?>"<?php echo ($integrationFormRecord['type_key'] ?? '') === $typeKey ? ' selected' : ''; ?>><?php echo htmlspecialchars((string) $typeLabel, ENT_QUOTES, 'UTF-8'); ?></option>
                                                <?php endforeach; ?>
                                            </select>
                                        </label>
                                        <label class="admin-form-grid__full">
                                            <span>Data</span>
                                            <textarea name="data_json" rows="12" data-integration-field="data_json" data-integration-data-input required><?php echo htmlspecialchars((string) ($integrationFormRecord['data_json'] ?? ''), ENT_QUOTES, 'UTF-8'); ?></textarea>
                                            <small class="admin-console-helper" data-integration-help><?php echo htmlspecialchars((string) ($integrationTypeHelpText[$integrationFormRecord['type_key'] ?? 'snippet'] ?? ''), ENT_QUOTES, 'UTF-8'); ?></small>
                                        </label>
                                    </div>
                                    <div class="admin-console-action-row">
                                        <button class="btn" type="submit">Save Integration</button>
                                        <button class="btn btn--secondary" type="button" data-integration-template-fill>Use Template</button>
                                    </div>
                                </form>

                                <section class="admin-console-integrations-browser">
                                    <div class="admin-console-table-tools admin-console-table-tools--inline">
                                        <label>
                                            <span>Search</span>
                                            <input type="search" placeholder="Search integrations" data-integration-filter-search>
                                        </label>
                                        <label>
                                            <span>Service</span>
                                            <select data-integration-filter-service>
                                                <option value="">All services</option>
                                                <?php foreach ($integrationServiceOptions as $serviceKey => $serviceLabel): ?>
                                                    <option value="<?php echo htmlspecialchars((string) $serviceKey, ENT_QUOTES, 'UTF-8'); ?>"><?php echo htmlspecialchars((string) $serviceLabel, ENT_QUOTES, 'UTF-8'); ?></option>
                                                <?php endforeach; ?>
                                            </select>
                                        </label>
                                        <label>
                                            <span>Type</span>
                                            <select data-integration-filter-type>
                                                <option value="">All types</option>
                                                <?php foreach ($integrationTypeOptions as $typeKey => $typeLabel): ?>
                                                    <option value="<?php echo htmlspecialchars((string) $typeKey, ENT_QUOTES, 'UTF-8'); ?>"><?php echo htmlspecialchars((string) $typeLabel, ENT_QUOTES, 'UTF-8'); ?></option>
                                                <?php endforeach; ?>
                                            </select>
                                        </label>
                                    </div>

                                    <div class="admin-console-record-list admin-console-record-list--integrations">
                                        <?php foreach ($integrationRecords as $record): ?>
                                            <?php
                                            $recordSearch = strtolower(implode(' ', [
                                                (string) ($record['name'] ?? ''),
                                                (string) ($record['service_label'] ?? ''),
                                                (string) ($record['type_label'] ?? ''),
                                                (string) ($record['summary'] ?? ''),
                                            ]));
                                            $recordMeta = get_admin_console_integration_meta($record);
                                            ?>
                                            <article class="admin-console-record-row admin-console-record-row--integration" data-integration-row data-search="<?php echo htmlspecialchars($recordSearch, ENT_QUOTES, 'UTF-8'); ?>" data-service="<?php echo htmlspecialchars((string) ($record['service_key'] ?? ''), ENT_QUOTES, 'UTF-8'); ?>" data-type="<?php echo htmlspecialchars((string) ($record['type_key'] ?? ''), ENT_QUOTES, 'UTF-8'); ?>">
                                                <div class="admin-console-record-row__content">
                                                    <div class="admin-console-record-row__header">
                                                        <h3><?php echo htmlspecialchars((string) ($record['name'] ?? 'Integration'), ENT_QUOTES, 'UTF-8'); ?></h3>
                                                        <?php render_admin_console_badge((string) ($record['type_label'] ?? ''), (string) ($record['type_key'] ?? 'default')); ?>
                                                    </div>
                                                    <?php if ($recordMeta !== []): ?>
                                                        <p class="admin-console-record-row__meta"><?php echo htmlspecialchars(implode(' | ', $recordMeta), ENT_QUOTES, 'UTF-8'); ?></p>
                                                    <?php endif; ?>
                                                </div>
                                                <?php render_admin_console_integration_actions($record); ?>
                                            </article>
                                        <?php endforeach; ?>
                                    </div>
                                </section>
                            </div>
                        </section>
                    <?php elseif (($modal['type'] ?? '') === 'record-editor'): ?>
                        <form class="admin-form admin-form--stacked admin-console-record-editor" method="post" data-console-record-form>
                            <input type="hidden" name="csrf_token" value="<?php echo htmlspecialchars((string) ($_SESSION['csrf_token'] ?? ''), ENT_QUOTES, 'UTF-8'); ?>">
                            <input type="hidden" name="action" value="save_console_record" data-console-record-action>
                            <input type="hidden" name="feature_key" value="<?php echo htmlspecialchars((string) ($recordEditorState['feature_key'] ?? ''), ENT_QUOTES, 'UTF-8'); ?>" data-console-record-feature-input>
                            <input type="hidden" name="record_id" value="<?php echo htmlspecialchars((string) ($recordEditorState['record_id'] ?? ''), ENT_QUOTES, 'UTF-8'); ?>" data-console-record-id-input>
                            <input type="hidden" name="source_modal_id" value="<?php echo htmlspecialchars((string) ($recordEditorState['source_modal_id'] ?? ($_POST['source_modal_id'] ?? '')), ENT_QUOTES, 'UTF-8'); ?>" data-console-record-source-modal-input>
                            <input type="hidden" name="source_invoice_id" value="<?php echo htmlspecialchars((string) ($recordEditorState['source_invoice_id'] ?? ''), ENT_QUOTES, 'UTF-8'); ?>">
                            <input type="hidden" name="mark_invoice_paid" value="<?php echo !empty($recordEditorState['mark_invoice_paid']) ? '1' : '0'; ?>">
                            <div class="admin-alert admin-alert--error admin-console-record-editor__notice<?php echo !empty($recordEditorState['editable']) ? ' is-hidden' : ''; ?>" data-console-record-readonly>
                                <?php echo htmlspecialchars((string) ($recordEditorState['read_only_message'] ?? 'This row is read only.'), ENT_QUOTES, 'UTF-8'); ?>
                            </div>
                            <div class="admin-form-grid" data-console-record-fields>
                                <?php render_admin_console_record_editor_fields($recordEditorState['fields'] ?? [], !empty($recordEditorState['editable'])); ?>
                            </div>
                            <div class="admin-form-actions admin-console-record-editor__actions">
                                <button class="btn" type="submit" data-console-record-save<?php echo !empty($recordEditorState['editable']) ? '' : ' disabled'; ?>>Save</button>
                                <button class="btn btn--danger" type="submit" formaction="" formmethod="post" name="action" value="delete_console_record" data-console-record-delete<?php echo !empty($recordEditorState['editable']) && trim((string) ($recordEditorState['record_id'] ?? '')) !== '' ? '' : ' disabled'; ?>>Delete</button>
                            </div>
                        </form>
                    <?php elseif (($modal['type'] ?? '') === 'placeholder'): ?>
                        <section class="admin-console-placeholder-card">
                            <h3>Under Construction</h3>
                            <p>This feature is intentionally present in the console, but the working system has not been built yet.</p>
                        </section>
                    <?php else: ?>
                        <?php if ($modalId === 'journal'): ?>
                            <div class="admin-console-modal-toolbar">
                                <a class="btn" href="accounting.php?modal=record-editor&amp;feature_key=journal&amp;source_modal_id=journal&amp;create=1">Add</a>
                            </div>
                        <?php endif; ?>
                        <?php render_admin_console_table($modal['rows'] ?? [], $modalId, 'all'); ?>
                    <?php endif; ?>
                </div>
            </div>
        </section>
    <?php endforeach; ?>
</main>