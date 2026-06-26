<?php

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
            <input type="<?php echo htmlspecialchars($fieldType, ENT_QUOTES, 'UTF-8'); ?>" name="record[<?php echo htmlspecialchars($fieldName, ENT_QUOTES, 'UTF-8'); ?>]" value="<?php echo htmlspecialchars($fieldValue, ENT_QUOTES, 'UTF-8'); ?>" <?php if ($fieldType === 'number'): ?>step="<?php echo htmlspecialchars($fieldStep, ENT_QUOTES, 'UTF-8'); ?>"<?php endif; ?> <?php echo $editable ? '' : ' disabled'; ?>>
        </label>
    <?php
    endforeach;
}

function render_admin_console_image_tag_selector(string $scope, array $tags, string $placeholder = 'Search tags', string $selectName = '', array $selectedTags = []): void {
    ?>
    <div class="admin-console-filter-bar admin-console-filter-bar--image-tags" data-image-tag-root="<?php echo htmlspecialchars($scope, ENT_QUOTES, 'UTF-8'); ?>">
        <div class="admin-console-filter-shell">
            <div class="admin-console-filter-shell__label">
                <input class="admin-console-filter-input" type="search" autocomplete="off" spellcheck="false" placeholder="<?php echo htmlspecialchars($placeholder, ENT_QUOTES, 'UTF-8'); ?>" data-image-tag-search="<?php echo htmlspecialchars($scope, ENT_QUOTES, 'UTF-8'); ?>" aria-expanded="false" aria-controls="imageTagDropdown-<?php echo htmlspecialchars($scope, ENT_QUOTES, 'UTF-8'); ?>">
            </div>
            <span class="admin-console-filter-shell__icon" aria-hidden="true">Search</span>
        </div>

        <div class="admin-console-selected-tags" data-image-selected-tags="<?php echo htmlspecialchars($scope, ENT_QUOTES, 'UTF-8'); ?>"></div>

        <div class="admin-console-filter-dropdown" id="imageTagDropdown-<?php echo htmlspecialchars($scope, ENT_QUOTES, 'UTF-8'); ?>" data-image-tag-dropdown="<?php echo htmlspecialchars($scope, ENT_QUOTES, 'UTF-8'); ?>" hidden>
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

function render_admin_console_feature_action_button(array $action): void {
    $label = trim((string) ($action['label'] ?? 'Open'));
    $variant = trim((string) ($action['variant'] ?? 'primary'));
    $buttonClass = 'btn' . ($variant === 'secondary' ? ' btn--secondary' : '');
    $href = trim((string) ($action['href'] ?? ''));
    $modal = trim((string) ($action['modal'] ?? ''));
    ?>
    <button class="<?php echo htmlspecialchars($buttonClass, ENT_QUOTES, 'UTF-8'); ?>" type="button" <?php if ($modal !== ''): ?>data-console-modal-open="<?php echo htmlspecialchars($modal, ENT_QUOTES, 'UTF-8'); ?>"<?php endif; ?> <?php if ($href !== ''): ?>data-feature-href="<?php echo htmlspecialchars($href, ENT_QUOTES, 'UTF-8'); ?>"<?php endif; ?>><?php echo htmlspecialchars($label, ENT_QUOTES, 'UTF-8'); ?></button>
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
            <div><dt>Total</dt><dd><?php echo htmlspecialchars((string) ($summary['total_integrations'] ?? 0), ENT_QUOTES, 'UTF-8'); ?></dd></div>
            <div><dt>Services</dt><dd><?php echo htmlspecialchars((string) ($summary['services_in_use'] ?? 0), ENT_QUOTES, 'UTF-8'); ?></dd></div>
            <div><dt>Types</dt><dd><?php echo htmlspecialchars((string) ($summary['types_in_use'] ?? 0), ENT_QUOTES, 'UTF-8'); ?></dd></div>
        </dl>
        <?php
    }
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
        <button class="btn btn--secondary admin-console-record-action" type="button" data-integration-edit data-id="<?php echo htmlspecialchars((string) ($record['id'] ?? ''), ENT_QUOTES, 'UTF-8'); ?>" data-name="<?php echo htmlspecialchars((string) ($record['name'] ?? ''), ENT_QUOTES, 'UTF-8'); ?>" data-service="<?php echo htmlspecialchars((string) ($record['service_key'] ?? ''), ENT_QUOTES, 'UTF-8'); ?>" data-type="<?php echo htmlspecialchars((string) ($record['type_key'] ?? ''), ENT_QUOTES, 'UTF-8'); ?>" data-json="<?php echo htmlspecialchars($recordPayload, ENT_QUOTES, 'UTF-8'); ?>">Edit</button>
        <form method="post" onsubmit="return confirm('Delete this integration?');">
            <input type="hidden" name="csrf_token" value="<?php echo htmlspecialchars((string) ($_SESSION['csrf_token'] ?? ''), ENT_QUOTES, 'UTF-8'); ?>">
            <input type="hidden" name="action" value="delete_integration">
            <input type="hidden" name="id" value="<?php echo htmlspecialchars((string) ($record['id'] ?? ''), ENT_QUOTES, 'UTF-8'); ?>">
            <button class="btn btn--danger admin-console-record-action" type="submit">Delete</button>
        </form>
    </div>
    <?php
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
        $sources[] = is_array($value) ? implode(' ', array_map('strval', $value)) : (string) $value;
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
            $groupedOptions['Statuses']['status:' . $status] = ['key' => 'status:' . $status, 'group' => 'Statuses', 'label' => format_admin_console_cell_value('status', $row['status'] ?? '')];
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
                    $groupedOptions[$group][$column . ':' . $normalized] = ['key' => $column . ':' . $normalized, 'group' => $group, 'label' => trim((string) $item)];
                }
                continue;
            }

            $normalized = normalize_admin_console_filter_token((string) $value);
            if ($normalized === '') {
                continue;
            }

            $group = get_admin_console_filter_group((string) $column);
            $groupedOptions[$group][$column . ':' . $normalized] = ['key' => $column . ':' . $normalized, 'group' => $group, 'label' => format_admin_console_cell_value((string) $column, $value)];
        }

        foreach (build_admin_console_seo_keywords($row) as $keyword) {
            $groupedOptions['SEO Words']['seo:' . $keyword] = ['key' => 'seo:' . $keyword, 'group' => 'SEO Words', 'label' => ucwords(str_replace('-', ' ', $keyword))];
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
                <input class="admin-console-filter-input" type="search" autocomplete="off" spellcheck="false" placeholder="Search statuses, tags, categories, services, or SEO words" data-console-filter-input="<?php echo htmlspecialchars($featureKey, ENT_QUOTES, 'UTF-8'); ?>" aria-expanded="false" aria-controls="consoleFilterDropdown-<?php echo htmlspecialchars($featureKey, ENT_QUOTES, 'UTF-8'); ?>">
            </div>
            <span class="admin-console-filter-shell__icon" aria-hidden="true">Search</span>
        </div>

        <div class="admin-console-filter-badge-row" data-console-filter-badges="<?php echo htmlspecialchars($featureKey, ENT_QUOTES, 'UTF-8'); ?>" hidden></div>

        <div class="admin-console-filter-dropdown" id="consoleFilterDropdown-<?php echo htmlspecialchars($featureKey, ENT_QUOTES, 'UTF-8'); ?>" data-console-filter-dropdown="<?php echo htmlspecialchars($featureKey, ENT_QUOTES, 'UTF-8'); ?>" hidden>
            <div class="admin-console-filter-options" data-console-filter-options="<?php echo htmlspecialchars($featureKey, ENT_QUOTES, 'UTF-8'); ?>">
                <?php foreach ($filterOptions as $option): ?>
                    <button class="admin-console-filter-option" type="button" data-console-filter-option data-filter-key="<?php echo htmlspecialchars((string) ($option['key'] ?? ''), ENT_QUOTES, 'UTF-8'); ?>" data-filter-group="<?php echo htmlspecialchars((string) ($option['group'] ?? ''), ENT_QUOTES, 'UTF-8'); ?>" data-filter-label="<?php echo htmlspecialchars((string) ($option['label'] ?? ''), ENT_QUOTES, 'UTF-8'); ?>">
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
                return is_array($value) ? implode(' ', array_map('strval', $value)) : (string) $value;
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