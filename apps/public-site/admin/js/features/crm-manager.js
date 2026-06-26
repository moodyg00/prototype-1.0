(function () {
    window.MoodyAdmin = window.MoodyAdmin || {};

    window.MoodyAdmin.initCrmManager = function initCrmManager() {
        const modalNodes = document.querySelectorAll('.page-admin-crm [data-admin-modal]');
        const searchInputs = document.querySelectorAll('.page-admin-crm [data-crm-search-input]');

        if (!modalNodes.length && !searchInputs.length) {
            return;
        }

        const pageCloseHref = window.location.pathname + window.location.search.replace(/([?&])modal=[^&]*&?/, '$1').replace(/[?&]$/, '');

        const closeModals = function closeModals() {
            modalNodes.forEach((node) => {
                if (node instanceof HTMLElement) {
                    node.hidden = true;
                }
            });

            if (window.location.search.includes('modal=')) {
                window.history.replaceState({}, document.title, pageCloseHref || window.location.pathname);
            }
        };

        document.querySelectorAll('.page-admin-crm [data-modal-close]').forEach((trigger) => {
            trigger.addEventListener('click', (event) => {
                const target = event.target;
                if (target instanceof HTMLAnchorElement) {
                    return;
                }

                event.preventDefault();
                closeModals();
            });
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                closeModals();
            }
        });

        searchInputs.forEach((input) => {
            const scope = input.getAttribute('data-crm-search-input');
            const table = scope ? document.querySelector('.page-admin-crm [data-crm-search-table="' + scope + '"]') : null;
            if (!(table instanceof HTMLElement)) {
                return;
            }

            const rows = Array.from(table.querySelectorAll('[data-crm-search-row]'));
            const emptyRow = table.querySelector('[data-crm-empty-row]');

            const applySearch = () => {
                const query = input.value.trim().toLowerCase();
                let visibleCount = 0;

                rows.forEach((row) => {
                    const haystack = (row.getAttribute('data-crm-search-index') || '').toLowerCase();
                    const matches = query === '' || haystack.includes(query);
                    row.hidden = !matches;
                    if (matches) {
                        visibleCount++;
                    }
                });

                if (emptyRow instanceof HTMLElement) {
                    emptyRow.hidden = visibleCount !== 0;
                }
            };

            input.addEventListener('input', applySearch);
            applySearch();
        });

        document.querySelectorAll('.page-admin-crm [data-crm-row-link]').forEach((row) => {
            const href = row.getAttribute('data-crm-row-link') || '';
            if (href === '') {
                return;
            }

            const openRowLink = () => {
                window.location.href = href;
            };

            row.addEventListener('click', (event) => {
                const target = event.target;
                if (target instanceof HTMLElement && (target.closest('a, button, input, select, textarea, form') || target.isContentEditable)) {
                    return;
                }

                openRowLink();
            });

            row.addEventListener('keydown', (event) => {
                if (event.key !== 'Enter' && event.key !== ' ') {
                    return;
                }

                event.preventDefault();
                openRowLink();
            });
        });
    };
})();