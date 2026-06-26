(function () {
    window.MoodySite = window.MoodySite || {};

    window.MoodySite.initEstimateModal = function initEstimateModal() {
        const estimateModal = document.getElementById('estimateModal');
        const estimateDialog = estimateModal ? estimateModal.querySelector('.estimate-modal__dialog') : null;
        const estimateOpenTriggers = document.querySelectorAll('[data-estimate-trigger]');
        const estimateCloseTriggers = estimateModal ? estimateModal.querySelectorAll('[data-estimate-close]') : [];
        const estimateResetTriggers = estimateModal ? estimateModal.querySelectorAll('[data-estimate-reset]') : [];
        const estimateForm = document.getElementById('serviceEstimateForm');
        const estimateMessage = document.getElementById('estimateFormMessage');
        const estimateFormView = estimateModal ? estimateModal.querySelector('[data-estimate-view="form"]') : null;
        const estimateResultView = estimateModal ? estimateModal.querySelector('[data-estimate-view="result"]') : null;
        let lastEstimateTrigger = null;

        function showEstimateFormView() {
            if (estimateFormView) {
                estimateFormView.hidden = false;
            }

            if (estimateResultView) {
                estimateResultView.hidden = true;
            }
        }

        function showEstimateResultView() {
            if (estimateFormView) {
                estimateFormView.hidden = true;
            }

            if (estimateResultView) {
                estimateResultView.hidden = false;

                const resultFocusTarget = estimateResultView.querySelector('[data-estimate-reset], [data-estimate-close], button, a');
                if (resultFocusTarget instanceof HTMLElement) {
                    resultFocusTarget.focus();
                }
            }
        }

        function closeEstimateModal() {
            if (!estimateModal) {
                return;
            }

            showEstimateFormView();
            setEstimateMessage('');
            estimateModal.hidden = true;
            document.body.classList.remove('has-modal-open');

            if (lastEstimateTrigger instanceof HTMLElement) {
                lastEstimateTrigger.focus();
            }
        }

        function openEstimateModal(trigger = null) {
            if (!estimateModal) {
                return;
            }

            if (trigger instanceof HTMLElement) {
                lastEstimateTrigger = trigger;
            }

            showEstimateFormView();
            estimateModal.hidden = false;
            document.body.classList.add('has-modal-open');

            const firstFocusable = estimateModal.querySelector('input, select, textarea, button');
            if (firstFocusable instanceof HTMLElement) {
                firstFocusable.focus();
            }
        }

        function shouldOpenEstimateModalFromHash() {
            return window.location.hash === '#estimate-modal' || window.location.hash === '#form-group';
        }

        function setEstimateMessage(message, state = '') {
            if (!estimateMessage) {
                return;
            }

            estimateMessage.hidden = !message;
            estimateMessage.textContent = message;
            estimateMessage.classList.remove('is-error', 'is-loading');
            if (state) {
                estimateMessage.classList.add(state);
            }
        }

        if (estimateForm) {
            estimateForm.addEventListener('submit', (event) => {
                event.preventDefault();
                setEstimateMessage('');
                showEstimateResultView();
            });
        }

        if (!(estimateModal && estimateDialog && estimateOpenTriggers.length > 0)) {
            return;
        }

        estimateOpenTriggers.forEach((trigger) => {
            trigger.addEventListener('click', (event) => {
                event.preventDefault();
                openEstimateModal(trigger);
            });
        });

        estimateCloseTriggers.forEach((trigger) => {
            trigger.addEventListener('click', () => {
                closeEstimateModal();
            });
        });

        estimateResetTriggers.forEach((trigger) => {
            trigger.addEventListener('click', () => {
                showEstimateFormView();

                const firstFocusable = estimateModal.querySelector('input, select, textarea, button');
                if (firstFocusable instanceof HTMLElement) {
                    firstFocusable.focus();
                }
            });
        });

        estimateModal.addEventListener('click', (event) => {
            if (!(event.target instanceof HTMLElement)) {
                return;
            }

            if (event.target.closest('[data-estimate-close]')) {
                closeEstimateModal();
            }
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && !estimateModal.hidden) {
                closeEstimateModal();
            }
        });

        if (shouldOpenEstimateModalFromHash()) {
            openEstimateModal();
        }

        window.addEventListener('hashchange', () => {
            if (shouldOpenEstimateModalFromHash()) {
                openEstimateModal();
            }
        });
    };
})();
