(function () {
    window.MoodySite = window.MoodySite || {};

    window.MoodySite.initSiteMenu = function initSiteMenu() {
        const siteMenuToggle = document.getElementById('siteMenuToggle');
        const siteMenuModal = document.getElementById('siteMenuModal');
        const siteMenuSubtoggles = document.querySelectorAll('.site-menu-subtoggle');
        const siteMenuToggleIcon = siteMenuToggle ? siteMenuToggle.querySelector('.site-menu-toggle-icon') : null;

        function setSiteMenuToggleState(isOpen) {
            if (!siteMenuToggle) {
                return;
            }

            siteMenuToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
            siteMenuToggle.setAttribute('aria-label', isOpen ? 'Close site menu' : 'Open site menu');

            if (siteMenuToggleIcon) {
                siteMenuToggleIcon.textContent = isOpen ? '×' : '☰';
            }
        }

        function closeAllSiteSubmenus() {
            siteMenuSubtoggles.forEach((toggle) => {
                const submenuId = toggle.getAttribute('aria-controls');
                const submenu = submenuId ? document.getElementById(submenuId) : null;

                toggle.setAttribute('aria-expanded', 'false');
                if (submenu) {
                    submenu.hidden = true;
                }
            });
        }

        function closeSiteMenu() {
            if (!siteMenuToggle || !siteMenuModal) {
                return;
            }

            siteMenuModal.hidden = true;
            setSiteMenuToggleState(false);
            closeAllSiteSubmenus();
        }

        function openSiteMenu() {
            if (!siteMenuToggle || !siteMenuModal) {
                return;
            }

            siteMenuModal.hidden = false;
            setSiteMenuToggleState(true);
        }

        if (!siteMenuToggle || !siteMenuModal) {
            return;
        }

        siteMenuToggle.addEventListener('click', (event) => {
            event.stopPropagation();
            if (siteMenuModal.hidden) {
                openSiteMenu();
            } else {
                closeSiteMenu();
            }
        });

        siteMenuModal.addEventListener('click', (event) => {
            event.stopPropagation();

            if (!(event.target instanceof HTMLElement)) {
                return;
            }

            const clickedLink = event.target.closest('.site-menu-link');
            if (!clickedLink) {
                return;
            }

            const targetHref = clickedLink.getAttribute('href') || '';
            closeSiteMenu();

            if (!targetHref) {
                return;
            }

            event.preventDefault();
            if (targetHref.startsWith('#')) {
                const localTarget = document.querySelector(targetHref);
                if (localTarget instanceof HTMLElement) {
                    localTarget.scrollIntoView({ behavior: 'smooth', block: 'start' });
                } else {
                    window.location.href = `index.php${targetHref}`;
                }
                return;
            }

            window.location.href = targetHref;
        });

        siteMenuSubtoggles.forEach((toggle) => {
            toggle.addEventListener('click', (event) => {
                event.stopPropagation();

                const submenuId = toggle.getAttribute('aria-controls');
                const submenu = submenuId ? document.getElementById(submenuId) : null;
                if (!submenu) {
                    return;
                }

                const shouldOpen = toggle.getAttribute('aria-expanded') !== 'true';
                closeAllSiteSubmenus();
                toggle.setAttribute('aria-expanded', shouldOpen ? 'true' : 'false');
                submenu.hidden = !shouldOpen;
            });
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                closeSiteMenu();
            }
        });

        window.addEventListener('click', (event) => {
            const target = event.target;
            if (!(target instanceof Node)) {
                return;
            }

            const clickedToggle = siteMenuToggle.contains(target);
            const clickedMenu = siteMenuModal.contains(target);

            if (!clickedToggle && !clickedMenu) {
                closeSiteMenu();
            }
        });
    };
})();
