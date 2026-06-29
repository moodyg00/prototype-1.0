(function () {
    window.MoodySite = window.MoodySite || {};

    window.MoodySite.initPageAdModal = function initPageAdModal() {
        const pageAdModal = document.getElementById('pageAdModal');
        const pageAdCloseTriggers = pageAdModal ? pageAdModal.querySelectorAll('[data-page-ad-close]') : [];

        function currentUrlHasAdTrigger() {
            const url = new URL(window.location.href);

            return url.searchParams.has('ad') || window.location.hash === '#ad-modal';
        }

        function clearAdTriggerFromUrl() {
            const url = new URL(window.location.href);
            url.searchParams.delete('ad');

            if (url.hash === '#ad-modal') {
                url.hash = '';
            }

            const nextUrl = url.pathname + url.search + url.hash;
            window.history.replaceState({}, '', nextUrl || window.location.pathname);
        }

        function closePageAdModal() {
            if (!pageAdModal) {
                return;
            }

            pageAdModal.hidden = true;
            document.body.classList.remove('has-page-ad-open');
            clearAdTriggerFromUrl();
        }

        function openPageAdModal() {
            if (!pageAdModal) {
                return;
            }

            pageAdModal.hidden = false;
            document.body.classList.add('has-page-ad-open');

            const firstFocusable = pageAdModal.querySelector('button, a');
            if (firstFocusable instanceof HTMLElement) {
                firstFocusable.focus();
            }
        }

        if (!pageAdModal) {
            return;
        }

        pageAdCloseTriggers.forEach((trigger) => {
            trigger.addEventListener('click', () => {
                closePageAdModal();
            });
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && !pageAdModal.hidden) {
                closePageAdModal();
            }
        });

        if (currentUrlHasAdTrigger()) {
            openPageAdModal();
        }
    };
})();