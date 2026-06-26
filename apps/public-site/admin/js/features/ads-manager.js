(function () {
    window.MoodyAdmin = window.MoodyAdmin || {};

    window.MoodyAdmin.initAdsManager = function initAdsManager() {
        const modalNodes = document.querySelectorAll('[data-admin-modal]');
        const pageCloseHref = window.location.pathname + window.location.search.replace(/([?&])modal=[^&]*&?/, '$1').replace(/[?&]$/, '');

        const openModal = function openModal(modalName) {
            modalNodes.forEach((node) => {
                if (!(node instanceof HTMLElement)) {
                    return;
                }

                node.hidden = node.dataset.adminModal !== modalName;
            });
        };

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

        document.querySelectorAll('[data-modal-open]').forEach((trigger) => {
            trigger.addEventListener('click', (event) => {
                event.preventDefault();
                if (!(trigger instanceof HTMLElement)) {
                    return;
                }

                openModal(trigger.dataset.modalOpen || '');
            });
        });

        document.querySelectorAll('[data-modal-switch]').forEach((trigger) => {
            trigger.addEventListener('click', (event) => {
                event.preventDefault();
                if (!(trigger instanceof HTMLElement)) {
                    return;
                }

                openModal(trigger.dataset.modalSwitch || '');
            });
        });

        document.querySelectorAll('[data-modal-close]').forEach((trigger) => {
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

        const imageSrcInput = document.querySelector('[data-ad-image-input="src"]');
        const imageAltInput = document.querySelector('[data-ad-image-input="alt"]');
        const previewRoot = document.querySelector('[data-ad-image-preview]');
        const previewImage = document.querySelector('[data-ad-image-preview-image]');
        const previewEmpty = document.querySelector('[data-ad-image-preview-empty]');
        const previewPath = document.querySelector('[data-ad-image-preview-path]');
        const imageCards = document.querySelectorAll('[data-image-card]');
        const imageChoiceButtons = document.querySelectorAll('[data-image-choice]');
        const imageFilterControls = document.querySelectorAll('[data-image-filter-control]');
        const clearImageFiltersButton = document.querySelector('[data-clear-image-filters]');
        const emptyState = document.querySelector('[data-image-library-empty]');
        const uploadFileInput = document.querySelector('[data-upload-file-input]');
        const uploadFileName = document.querySelector('[data-upload-file-name]');

        const syncSelectedImageState = function syncSelectedImageState() {
            if (!(imageSrcInput instanceof HTMLInputElement) || !(previewRoot instanceof HTMLElement) || !(previewPath instanceof HTMLElement)) {
                return;
            }

            const selectedSrc = imageSrcInput.value.trim();
            const selectedAlt = imageAltInput instanceof HTMLInputElement ? imageAltInput.value.trim() : '';
            const hasSelectedImage = selectedSrc !== '';

            previewRoot.classList.toggle('is-empty', !hasSelectedImage);
            previewPath.textContent = hasSelectedImage ? selectedSrc : 'Choose an uploaded image or enter a path.';

            if (previewImage instanceof HTMLImageElement) {
                if (hasSelectedImage) {
                    previewImage.src = selectedSrc;
                    previewImage.alt = selectedAlt || 'Selected ad image';
                    previewImage.hidden = false;
                } else {
                    previewImage.hidden = true;
                    previewImage.removeAttribute('src');
                }
            }

            if (previewEmpty instanceof HTMLElement) {
                previewEmpty.hidden = hasSelectedImage;
            }

            imageCards.forEach((card) => {
                if (!(card instanceof HTMLElement)) {
                    return;
                }

                card.classList.toggle('is-selected', hasSelectedImage && card.dataset.imageSrc === selectedSrc);
            });
        };

        imageChoiceButtons.forEach((button) => {
            button.addEventListener('click', () => {
                if (!(button instanceof HTMLElement) || !(imageSrcInput instanceof HTMLInputElement)) {
                    return;
                }

                const selectedSrc = button.dataset.imageSrc || '';
                const selectedAlt = button.dataset.imageAlt || '';
                imageSrcInput.value = selectedSrc;

                if (imageAltInput instanceof HTMLInputElement) {
                    imageAltInput.value = selectedAlt;
                }

                syncSelectedImageState();
                openModal('ad');
            });
        });

        if (imageSrcInput instanceof HTMLInputElement) {
            imageSrcInput.addEventListener('input', syncSelectedImageState);
        }

        if (imageAltInput instanceof HTMLInputElement) {
            imageAltInput.addEventListener('input', syncSelectedImageState);
        }

        const applyImageFilters = function applyImageFilters() {
            const activeTags = Array.from(imageFilterControls)
                .filter((control) => control instanceof HTMLInputElement && control.checked)
                .map((control) => control.value);

            let visibleCount = 0;

            imageCards.forEach((card) => {
                if (!(card instanceof HTMLElement)) {
                    return;
                }

                const cardTags = (card.dataset.imageTags || '').split(',').filter(Boolean);
                const matches = activeTags.every((tag) => cardTags.includes(tag));
                card.hidden = !matches;

                if (matches) {
                    visibleCount += 1;
                }
            });

            if (emptyState instanceof HTMLElement) {
                emptyState.hidden = visibleCount !== 0;
            }
        };

        imageFilterControls.forEach((control) => {
            control.addEventListener('change', applyImageFilters);
        });

        if (clearImageFiltersButton instanceof HTMLButtonElement) {
            clearImageFiltersButton.addEventListener('click', () => {
                imageFilterControls.forEach((control) => {
                    if (control instanceof HTMLInputElement) {
                        control.checked = false;
                    }
                });

                applyImageFilters();
            });
        }

        if (uploadFileInput instanceof HTMLInputElement && uploadFileName instanceof HTMLElement) {
            uploadFileInput.addEventListener('change', () => {
                const selectedFile = uploadFileInput.files && uploadFileInput.files[0] ? uploadFileInput.files[0].name : 'Select a JPG, PNG, WEBP, or GIF';
                uploadFileName.textContent = selectedFile;
            });
        }

        syncSelectedImageState();
        applyImageFilters();
    };
})();