(function () {
    window.MoodySite = window.MoodySite || {};

    window.MoodySite.initFloatingTextButton = function initFloatingTextButton() {
        const siteHeader = document.querySelector('.site-header');
        const siteFloatingTextButton = document.querySelector('.site-floating-text-btn');

        if (!siteHeader || !siteFloatingTextButton) {
            return;
        }

        function syncFloatingTextButton() {
            const showButton = window.scrollY > siteHeader.offsetHeight;
            siteFloatingTextButton.classList.toggle('is-visible', showButton);
        }

        syncFloatingTextButton();
        window.addEventListener('scroll', syncFloatingTextButton, { passive: true });
        window.addEventListener('resize', syncFloatingTextButton);
    };
})();
