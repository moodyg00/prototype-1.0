(function () {
    window.MoodyAdmin = window.MoodyAdmin || {};

    window.MoodyAdmin.initAdminConsole = function initAdminConsole() {
        const openButtons = document.querySelectorAll('[data-console-modal-open]');
        const navigationButtons = document.querySelectorAll('[data-feature-href]');
        const closeButtons = document.querySelectorAll('[data-console-modal-close]');
        const consoleFilterRoots = document.querySelectorAll('[data-console-filter]');
        const integrationModal = document.querySelector('[data-console-modal="integrations-manager"], [data-integration-manager-root]');
        const carouselModal = document.querySelector('[data-console-modal="image-carousel"]');
        const imageEditModal = document.querySelector('[data-console-modal="image-edit"]');
        const recordEditorModal = document.querySelector('[data-console-modal="record-editor"]');
        const galleryItems = Array.from(document.querySelectorAll('[data-carousel-open]'));
        let currentCarouselIndex = 0;

        const integrationSearchInput = integrationModal ? integrationModal.querySelector('[data-integration-filter-search]') : null;
        const integrationServiceFilter = integrationModal ? integrationModal.querySelector('[data-integration-filter-service]') : null;
        const integrationTypeFilter = integrationModal ? integrationModal.querySelector('[data-integration-filter-type]') : null;
        const integrationForm = integrationModal ? integrationModal.querySelector('[data-integration-form]') : null;
        const integrationTypeSelect = integrationModal ? integrationModal.querySelector('[data-integration-type-select]') : null;
        const integrationServiceSelect = integrationModal ? integrationModal.querySelector('[data-integration-service-select]') : null;
        const integrationCustomService = integrationModal ? integrationModal.querySelector('[data-integration-custom-service]') : null;
        const integrationDataInput = integrationModal ? integrationModal.querySelector('[data-integration-data-input]') : null;
        const integrationHelp = integrationModal ? integrationModal.querySelector('[data-integration-help]') : null;
        const templateButton = integrationModal ? integrationModal.querySelector('[data-integration-template-fill]') : null;
        const resetButton = integrationModal ? integrationModal.querySelector('[data-integration-form-reset]') : null;

        const integrationTemplates = integrationModal ? JSON.parse(integrationModal.getAttribute('data-integration-templates') || '{}') : {};
        const integrationHelpText = integrationModal ? JSON.parse(integrationModal.getAttribute('data-integration-help-text') || '{}') : {};
        const recordEditorForm = recordEditorModal ? recordEditorModal.querySelector('[data-console-record-form]') : null;
        const recordEditorTitle = recordEditorModal ? recordEditorModal.querySelector('#modalTitle-record-editor') : null;
        const recordEditorFields = recordEditorModal ? recordEditorModal.querySelector('[data-console-record-fields]') : null;
        const recordEditorFeatureInput = recordEditorModal ? recordEditorModal.querySelector('[data-console-record-feature-input]') : null;
        const recordEditorIdInput = recordEditorModal ? recordEditorModal.querySelector('[data-console-record-id-input]') : null;
        const recordEditorSourceModalInput = recordEditorModal ? recordEditorModal.querySelector('[data-console-record-source-modal-input]') : null;
        const recordEditorActionInput = recordEditorModal ? recordEditorModal.querySelector('[data-console-record-action]') : null;
        const recordEditorSaveButton = recordEditorModal ? recordEditorModal.querySelector('[data-console-record-save]') : null;
        const recordEditorDeleteButton = recordEditorModal ? recordEditorModal.querySelector('[data-console-record-delete]') : null;
        const recordEditorReadonly = recordEditorModal ? recordEditorModal.querySelector('[data-console-record-readonly]') : null;
        const imageUploadInput = document.querySelector('[data-image-upload-input]');
        const imageUploadLabel = document.querySelector('[data-image-upload-label]');

        function closeImageTagDropdowns(exceptScope) {
            document.querySelectorAll('[data-image-tag-root]').forEach((root) => {
                const scope = root.getAttribute('data-image-tag-root') || '';
                if (exceptScope !== undefined && scope === exceptScope) {
                    return;
                }

                const dropdown = root.querySelector('[data-image-tag-dropdown]');
                const input = root.querySelector('[data-image-tag-search]');
                if (dropdown) {
                    dropdown.hidden = true;
                }
                if (input) {
                    input.setAttribute('aria-expanded', 'false');
                }
            });
        }

        function closeAllModals() {
            document.querySelectorAll('[data-console-modal]').forEach((modal) => {
                modal.hidden = true;
            });
        }

        function openModal(modal) {
            if (!modal) {
                return;
            }

            closeAllModals();
            modal.hidden = false;
        }

        function closeConsoleFilterDropdowns(exceptKey) {
            consoleFilterRoots.forEach((root) => {
                const key = root.getAttribute('data-console-filter') || '';
                if (exceptKey !== undefined && key === exceptKey) {
                    return;
                }

                const dropdown = root.querySelector('[data-console-filter-dropdown]');
                const input = root.querySelector('[data-console-filter-input]');
                if (dropdown) {
                    dropdown.hidden = true;
                }
                if (input) {
                    input.setAttribute('aria-expanded', 'false');
                }
            });
        }

        function parseConsoleFilterTokens(row) {
            try {
                const parsed = JSON.parse(row.getAttribute('data-filter-tokens') || '[]');
                return Array.isArray(parsed) ? parsed : [];
            } catch (error) {
                return [];
            }
        }

        function buildConsoleFilterBadge(key, group, label) {
            const badge = document.createElement('button');
            badge.type = 'button';
            badge.className = 'admin-console-filter-badge';
            badge.setAttribute('data-console-active-filter', key);

            const text = document.createElement('span');
            text.textContent = group + ': ' + label;
            badge.appendChild(text);

            const close = document.createElement('span');
            close.textContent = 'x';
            close.setAttribute('aria-hidden', 'true');
            badge.appendChild(close);

            return badge;
        }

        function parseConsoleRecordFields(value) {
            try {
                const parsed = JSON.parse(value || '[]');
                return Array.isArray(parsed) ? parsed : [];
            } catch (error) {
                return [];
            }
        }

        function renderConsoleRecordEditorFields(fields, editable) {
            if (!recordEditorFields) {
                return;
            }

            recordEditorFields.innerHTML = '';

            fields.forEach((field) => {
                const name = field && typeof field.name === 'string' ? field.name : '';
                if (!name) {
                    return;
                }

                const label = document.createElement('label');
                const labelText = document.createElement('span');
                labelText.textContent = field.label || name;
                label.appendChild(labelText);

                const input = document.createElement('input');
                input.type = field.type || 'text';
                input.name = 'record[' + name + ']';
                input.value = field.value || '';
                if (input.type === 'number' && field.step) {
                    input.step = field.step;
                }
                input.disabled = !editable;
                label.appendChild(input);
                recordEditorFields.appendChild(label);
            });
        }

        function openConsoleRecordEditor(source) {
            if (!(recordEditorModal && recordEditorForm && recordEditorFields && recordEditorTitle && recordEditorFeatureInput && recordEditorIdInput && recordEditorSourceModalInput && recordEditorActionInput && recordEditorSaveButton && recordEditorDeleteButton && recordEditorReadonly)) {
                return;
            }

            const featureKey = source.getAttribute('data-console-record-feature') || '';
            const sourceModalId = source.getAttribute('data-console-record-source-modal') || '';
            const recordId = source.getAttribute('data-record-id') || '';
            const title = source.getAttribute('data-console-record-title') || 'Edit Record';
            const editable = (source.getAttribute('data-console-record-editable') || '0') === '1';
            const fields = parseConsoleRecordFields(source.getAttribute('data-console-record-fields'));

            recordEditorTitle.textContent = title;
            recordEditorFeatureInput.value = featureKey;
            recordEditorIdInput.value = recordId;
            recordEditorSourceModalInput.value = sourceModalId;
            recordEditorActionInput.value = 'save_console_record';
            recordEditorSaveButton.disabled = !editable;
            recordEditorDeleteButton.disabled = !editable;
            recordEditorReadonly.classList.toggle('is-hidden', editable);
            renderConsoleRecordEditorFields(fields, editable);
            openModal(recordEditorModal);
        }

        function initConsoleTableFilter(root) {
            const key = root.getAttribute('data-console-filter') || '';
            const input = root.querySelector('[data-console-filter-input]');
            const dropdown = root.querySelector('[data-console-filter-dropdown]');
            const badges = root.querySelector('[data-console-filter-badges]');
            const optionButtons = Array.from(root.querySelectorAll('[data-console-filter-option]'));
            const table = document.querySelector('[data-console-table="' + key + '"]');
            const activeFilters = new Map();

            if (!(key && input && dropdown && badges && table)) {
                return;
            }

            function renderBadges() {
                badges.innerHTML = '';
                badges.hidden = activeFilters.size === 0;

                if (activeFilters.size === 0) {
                    return;
                }

                activeFilters.forEach((value, filterKey) => {
                    const badge = buildConsoleFilterBadge(filterKey, value.group, value.label);
                    badge.addEventListener('click', (event) => {
                        event.stopPropagation();
                        activeFilters.delete(filterKey);
                        syncOptionState();
                        renderBadges();
                        applyFilters();
                    });
                    badges.appendChild(badge);
                });
            }

            function syncOptionState() {
                optionButtons.forEach((button) => {
                    const filterKey = button.getAttribute('data-filter-key') || '';
                    button.classList.toggle('is-selected', activeFilters.has(filterKey));
                });
            }

            function getVisibleOptions() {
                return optionButtons.filter((button) => !button.hidden);
            }

            function normalizeSearchValue(value) {
                return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
            }

            function syncDropdownVisibility() {
                const shouldOpen = input.value.trim() !== '' && getVisibleOptions().length > 0;
                dropdown.hidden = !shouldOpen;
                input.setAttribute('aria-expanded', shouldOpen ? 'true' : 'false');
            }

            function filterOptions() {
                const query = normalizeSearchValue(input.value);

                optionButtons.forEach((button) => {
                    const haystack = normalizeSearchValue((button.getAttribute('data-filter-group') || '') + ' ' + (button.getAttribute('data-filter-label') || ''));
                    button.hidden = query === '' || !haystack.includes(query);
                });

                syncDropdownVisibility();
            }

            function addFilter(filterKey, group, label) {
                if (filterKey === '' || activeFilters.has(filterKey)) {
                    input.value = '';
                    filterOptions();
                    return;
                }

                activeFilters.set(filterKey, { group, label });
                syncOptionState();
                renderBadges();
                applyFilters();
                input.value = '';
                filterOptions();
            }

            function addFilterFromButton(button) {
                addFilter(
                    button.getAttribute('data-filter-key') || '',
                    button.getAttribute('data-filter-group') || '',
                    button.getAttribute('data-filter-label') || ''
                );
            }

            function addFilterFromInput() {
                const query = normalizeSearchValue(input.value);
                if (query === '') {
                    return;
                }

                const exactMatch = optionButtons.find((button) => {
                    const group = normalizeSearchValue(button.getAttribute('data-filter-group') || '');
                    const label = normalizeSearchValue(button.getAttribute('data-filter-label') || '');
                    return !button.hidden && (label === query || (group + ' ' + label) === query);
                });

                if (exactMatch) {
                    addFilterFromButton(exactMatch);
                    return;
                }

                const visibleOptions = getVisibleOptions();
                if (visibleOptions.length === 1) {
                    addFilterFromButton(visibleOptions[0]);
                }
            }

            function applyFilters() {
                const selectedKeys = Array.from(activeFilters.keys());

                table.querySelectorAll('[data-console-row]').forEach((row) => {
                    const rowTokens = parseConsoleFilterTokens(row);
                    const matches = selectedKeys.length === 0 || selectedKeys.every((selectedKey) => rowTokens.includes(selectedKey));
                    row.hidden = !matches;
                });
            }

            input.addEventListener('focus', () => {
                closeConsoleFilterDropdowns(key);
                filterOptions();
            });

            input.addEventListener('input', () => {
                closeConsoleFilterDropdowns(key);
                filterOptions();
            });

            input.addEventListener('keydown', (event) => {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    addFilterFromInput();
                    return;
                }

                if (event.key === 'Escape') {
                    dropdown.hidden = true;
                    input.setAttribute('aria-expanded', 'false');
                }
            });

            optionButtons.forEach((button) => {
                button.addEventListener('click', () => {
                    addFilterFromButton(button);
                    input.focus();
                });
            });

            document.addEventListener('click', (event) => {
                if (!root.contains(event.target)) {
                    dropdown.hidden = true;
                    input.setAttribute('aria-expanded', 'false');
                }
            });

            renderBadges();
            syncOptionState();
            applyFilters();
            filterOptions();
        }

        function applyIntegrationFilters() {
            if (!integrationModal) {
                return;
            }

            const searchValue = integrationSearchInput ? integrationSearchInput.value.trim().toLowerCase() : '';
            const serviceValue = integrationServiceFilter ? integrationServiceFilter.value.trim().toLowerCase() : '';
            const typeValue = integrationTypeFilter ? integrationTypeFilter.value.trim().toLowerCase() : '';

            integrationModal.querySelectorAll('[data-integration-row]').forEach((row) => {
                const matchesSearch = searchValue === '' || (row.getAttribute('data-search') || '').includes(searchValue);
                const matchesService = serviceValue === '' || (row.getAttribute('data-service') || '') === serviceValue;
                const matchesType = typeValue === '' || (row.getAttribute('data-type') || '') === typeValue;
                row.hidden = !(matchesSearch && matchesService && matchesType);
            });
        }

        function updateIntegrationTypeUI() {
            if (!integrationTypeSelect || !integrationDataInput || !integrationHelp) {
                return;
            }

            const typeKey = integrationTypeSelect.value;
            const template = integrationTemplates[typeKey];
            const helpText = integrationHelpText[typeKey] || '';
            integrationHelp.textContent = helpText;
            if (template) {
                integrationDataInput.placeholder = JSON.stringify(template, null, 2);
            }
        }

        function updateIntegrationServiceUI() {
            if (!integrationServiceSelect || !integrationCustomService) {
                return;
            }

            integrationCustomService.classList.toggle('is-hidden', integrationServiceSelect.value !== '__custom__');
        }

        function resetIntegrationForm() {
            if (!integrationForm) {
                return;
            }

            integrationForm.reset();
            const idField = integrationForm.querySelector('[data-integration-field="id"]');
            if (idField) {
                idField.value = '';
            }
            updateIntegrationServiceUI();
            updateIntegrationTypeUI();
            if (integrationDataInput && integrationTemplates.snippet) {
                integrationDataInput.value = JSON.stringify(integrationTemplates.snippet, null, 2);
            }
        }

        function setIntegrationModalFilters(button) {
            if (!integrationModal) {
                return;
            }

            if (integrationServiceFilter) {
                integrationServiceFilter.value = button.getAttribute('data-integration-service-filter') || '';
            }

            if (integrationTypeFilter) {
                integrationTypeFilter.value = button.getAttribute('data-integration-type-filter') || '';
            }

            if (integrationSearchInput) {
                integrationSearchInput.value = button.getAttribute('data-integration-search-filter') || '';
            }

            applyIntegrationFilters();
        }

        function getTagSelect(scope) {
            return document.querySelector('[data-image-tag-select="' + scope + '"]');
        }

        function getTagButtons(scope) {
            return document.querySelectorAll('[data-image-tag-toggle="' + scope + '"]');
        }

        function syncTagSelector(scope) {
            const select = getTagSelect(scope);
            const container = document.querySelector('[data-image-selected-tags="' + scope + '"]');
            if (!(select && container)) {
                return;
            }

            const selectedValues = Array.from(select.options)
                .filter((option) => option.selected)
                .map((option) => option.value);

            container.innerHTML = '';
            selectedValues.forEach((value) => {
                const chip = document.createElement('button');
                chip.type = 'button';
                chip.className = 'admin-console-selected-tag';
                chip.textContent = value.replace(/-/g, ' ');
                chip.setAttribute('data-image-tag-toggle', scope);
                chip.setAttribute('data-tag-value', value);
                container.appendChild(chip);
            });

            getTagButtons(scope).forEach((button) => {
                button.classList.toggle('is-selected', selectedValues.includes(button.getAttribute('data-tag-value') || ''));
            });
        }

        function toggleTag(scope, value) {
            const select = getTagSelect(scope);
            if (!select) {
                return;
            }

            Array.from(select.options).forEach((option) => {
                if (option.value === value) {
                    option.selected = !option.selected;
                }
            });

            syncTagSelector(scope);

            if (scope === 'gallery') {
                applyGalleryFilters();
            }
        }

        function filterTagOptions(scope) {
            const root = document.querySelector('[data-image-tag-root="' + scope + '"]');
            const searchInput = document.querySelector('[data-image-tag-search="' + scope + '"]');
            const dropdown = root ? root.querySelector('[data-image-tag-dropdown]') : null;
            const query = searchInput ? searchInput.value.trim().toLowerCase() : '';
            let visibleCount = 0;

            getTagButtons(scope).forEach((button) => {
                const value = ((button.getAttribute('data-tag-value') || '') + ' ' + button.textContent).toLowerCase();
                const hidden = query !== '' && !value.includes(query);
                button.hidden = hidden;
                if (!hidden) {
                    visibleCount += 1;
                }
            });

            if (dropdown && searchInput) {
                const shouldOpen = query !== '' && visibleCount > 0;
                dropdown.hidden = !shouldOpen;
                searchInput.setAttribute('aria-expanded', shouldOpen ? 'true' : 'false');
            }
        }

        function applyGalleryFilters() {
            const select = getTagSelect('gallery');
            const selectedTags = select ? Array.from(select.options).filter((option) => option.selected).map((option) => option.value) : [];
            document.querySelectorAll('[data-gallery-item]').forEach((item) => {
                const tags = (item.getAttribute('data-tags') || '').split(/\s+/).filter(Boolean);
                const matches = selectedTags.length === 0 || selectedTags.every((tag) => tags.includes(tag));
                item.hidden = !matches;
            });
        }

        function showCarouselItem(index) {
            if (!carouselModal || galleryItems.length === 0) {
                return;
            }

            currentCarouselIndex = (index + galleryItems.length) % galleryItems.length;
            const item = galleryItems[currentCarouselIndex];
            const image = carouselModal.querySelector('[data-carousel-image]');
            const caption = carouselModal.querySelector('[data-carousel-caption]');
            const meta = carouselModal.querySelector('[data-carousel-meta]');
            const editButton = carouselModal.querySelector('[data-carousel-edit]');
            if (!(image && caption && meta && editButton)) {
                return;
            }

            image.src = item.getAttribute('data-src') || '';
            image.alt = item.getAttribute('data-alt') || '';
            caption.textContent = item.getAttribute('data-alt') || 'Library image';
            meta.textContent = item.getAttribute('data-visible-on-page') || '';
            editButton.setAttribute('data-image-id', item.getAttribute('data-id') || '');
            editButton.setAttribute('data-image-alt', item.getAttribute('data-alt') || '');
            editButton.setAttribute('data-image-tags', item.getAttribute('data-tags') || '');
            editButton.setAttribute('data-image-visible-on-page', item.getAttribute('data-visible-on-page') || '');
        }

        openButtons.forEach((button) => {
            button.addEventListener('click', () => {
                const modalId = button.getAttribute('data-console-modal-open');
                const modal = document.querySelector('[data-console-modal="' + modalId + '"]');
                if (!modal) {
                    return;
                }

                openModal(modal);
                if (modal === integrationModal) {
                    setIntegrationModalFilters(button);
                }
                if (modal === carouselModal) {
                    const targetIndex = galleryItems.indexOf(button);
                    if (targetIndex >= 0) {
                        showCarouselItem(targetIndex);
                    }
                }
            });
        });

        navigationButtons.forEach((button) => {
            button.addEventListener('click', () => {
                const href = button.getAttribute('data-feature-href');
                if (href) {
                    window.location.href = href;
                }
            });
        });

        document.querySelectorAll('[data-console-record-open]').forEach((target) => {
            target.addEventListener('click', (event) => {
                if (event.target instanceof HTMLElement && event.target.closest('form')) {
                    return;
                }

                const source = target.closest('[data-console-row]') || target;
                openConsoleRecordEditor(source);
            });

            if (target.matches('[data-console-row]')) {
                target.addEventListener('keydown', (event) => {
                    if (event.key !== 'Enter' && event.key !== ' ') {
                        return;
                    }

                    event.preventDefault();
                    openConsoleRecordEditor(target);
                });
            }
        });

        closeButtons.forEach((button) => {
            button.addEventListener('click', () => {
                const modal = button.closest('[data-console-modal]');
                if (modal) {
                    modal.hidden = true;
                }
            });
        });

        if (recordEditorForm) {
            recordEditorForm.addEventListener('submit', (event) => {
                const submitter = event.submitter;
                if (!(submitter instanceof HTMLElement) || !recordEditorActionInput) {
                    return;
                }

                if (submitter.hasAttribute('data-console-record-delete')) {
                    if (!window.confirm('Delete this record?')) {
                        event.preventDefault();
                        return;
                    }

                    recordEditorActionInput.value = 'delete_console_record';
                    return;
                }

                recordEditorActionInput.value = 'save_console_record';
            });
        }

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                closeAllModals();
            }
        });

        consoleFilterRoots.forEach((root) => {
            initConsoleTableFilter(root);
        });

        if (integrationSearchInput) {
            integrationSearchInput.addEventListener('input', applyIntegrationFilters);
        }

        if (integrationServiceFilter) {
            integrationServiceFilter.addEventListener('change', applyIntegrationFilters);
        }

        if (integrationTypeFilter) {
            integrationTypeFilter.addEventListener('change', applyIntegrationFilters);
        }

        if (integrationTypeSelect) {
            integrationTypeSelect.addEventListener('change', updateIntegrationTypeUI);
        }

        if (integrationServiceSelect) {
            integrationServiceSelect.addEventListener('change', updateIntegrationServiceUI);
        }

        if (templateButton) {
            templateButton.addEventListener('click', () => {
                if (!integrationTypeSelect || !integrationDataInput) {
                    return;
                }

                const template = integrationTemplates[integrationTypeSelect.value];
                if (template) {
                    integrationDataInput.value = JSON.stringify(template, null, 2);
                }
            });
        }

        if (resetButton) {
            resetButton.addEventListener('click', resetIntegrationForm);
        }

        document.querySelectorAll('[data-integration-edit]').forEach((button) => {
            button.addEventListener('click', () => {
                if (!integrationForm) {
                    return;
                }

                const idField = integrationForm.querySelector('[data-integration-field="id"]');
                const nameField = integrationForm.querySelector('[data-integration-field="name"]');
                if (idField) {
                    idField.value = button.getAttribute('data-id') || '';
                }
                if (nameField) {
                    nameField.value = button.getAttribute('data-name') || '';
                }
                if (integrationServiceSelect) {
                    integrationServiceSelect.value = button.getAttribute('data-service') || '';
                }
                if (integrationTypeSelect) {
                    integrationTypeSelect.value = button.getAttribute('data-type') || 'snippet';
                }
                if (integrationDataInput) {
                    integrationDataInput.value = button.getAttribute('data-json') || '';
                }

                updateIntegrationServiceUI();
                updateIntegrationTypeUI();
            });
        });

        document.querySelectorAll('[data-image-tag-search]').forEach((input) => {
            input.addEventListener('focus', () => {
                const scope = input.getAttribute('data-image-tag-search');
                if (scope) {
                    closeImageTagDropdowns(scope);
                    filterTagOptions(scope);
                }
            });

            input.addEventListener('input', () => {
                const scope = input.getAttribute('data-image-tag-search');
                if (scope) {
                    closeImageTagDropdowns(scope);
                    filterTagOptions(scope);
                }
            });

            input.addEventListener('keydown', (event) => {
                if (event.key === 'Enter') {
                    const scope = input.getAttribute('data-image-tag-search');
                    if (scope) {
                        event.preventDefault();
                        const root = document.querySelector('[data-image-tag-root="' + scope + '"]');
                        const visibleButton = root ? root.querySelector('[data-image-tag-toggle]:not([hidden])') : null;
                        if (visibleButton instanceof HTMLElement) {
                            visibleButton.click();
                        }
                    }
                    return;
                }

                if (event.key === 'Escape') {
                    const scope = input.getAttribute('data-image-tag-search');
                    const root = scope ? document.querySelector('[data-image-tag-root="' + scope + '"]') : null;
                    const dropdown = root ? root.querySelector('[data-image-tag-dropdown]') : null;
                    if (dropdown) {
                        dropdown.hidden = true;
                        input.setAttribute('aria-expanded', 'false');
                    }
                }
            });
        });

        document.querySelectorAll('[data-image-tag-toggle]').forEach((button) => {
            button.addEventListener('click', () => {
                const scope = button.getAttribute('data-image-tag-toggle');
                const value = button.getAttribute('data-tag-value');
                if (scope && value) {
                    toggleTag(scope, value);
                    const input = document.querySelector('[data-image-tag-search="' + scope + '"]');
                    if (input) {
                        input.focus();
                    }
                }
            });
        });

        if (imageUploadInput && imageUploadLabel) {
            imageUploadInput.addEventListener('change', () => {
                const fileCount = imageUploadInput.files ? imageUploadInput.files.length : 0;
                if (fileCount === 0) {
                    imageUploadLabel.textContent = 'Choose images';
                    return;
                }

                imageUploadLabel.textContent = fileCount === 1 ? (imageUploadInput.files[0].name || '1 image selected') : fileCount + ' images selected';
            });
        }

        document.addEventListener('click', (event) => {
            if (!(event.target instanceof Element) || event.target.closest('[data-image-tag-root]')) {
                return;
            }

            closeImageTagDropdowns();
        });

        if (carouselModal) {
            const previousButton = carouselModal.querySelector('[data-carousel-previous]');
            const nextButton = carouselModal.querySelector('[data-carousel-next]');
            const editButton = carouselModal.querySelector('[data-carousel-edit]');

            if (previousButton) {
                previousButton.addEventListener('click', () => showCarouselItem(currentCarouselIndex - 1));
            }

            if (nextButton) {
                nextButton.addEventListener('click', () => showCarouselItem(currentCarouselIndex + 1));
            }

            if (editButton) {
                editButton.addEventListener('click', () => {
                    if (!imageEditModal) {
                        return;
                    }

                    const form = imageEditModal.querySelector('[data-image-edit-form]');
                    if (form) {
                        const idField = form.querySelector('[data-image-edit-field="id"]');
                        const altField = form.querySelector('[data-image-edit-field="alt"]');
                        const visibleOnPageField = form.querySelector('[data-image-edit-field="visible_on_page"]');
                        if (idField) {
                            idField.value = editButton.getAttribute('data-image-id') || '';
                        }
                        if (altField) {
                            altField.value = editButton.getAttribute('data-image-alt') || '';
                        }
                        if (visibleOnPageField) {
                            visibleOnPageField.value = editButton.getAttribute('data-image-visible-on-page') || '';
                        }

                        const editSelect = form.querySelector('[data-image-tag-select="edit"]');
                        const tags = (editButton.getAttribute('data-image-tags') || '').split(/\s+/).filter(Boolean);
                        if (editSelect) {
                            Array.from(editSelect.options).forEach((option) => {
                                option.selected = tags.includes(option.value);
                            });
                        }
                        syncTagSelector('edit');
                    }

                    openModal(imageEditModal);
                });
            }
        }

        updateIntegrationServiceUI();
        updateIntegrationTypeUI();
        applyIntegrationFilters();
        ['upload', 'edit', 'gallery'].forEach((scope) => {
            syncTagSelector(scope);
            filterTagOptions(scope);
        });
        applyGalleryFilters();
    };
})();