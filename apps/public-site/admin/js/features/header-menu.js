(function () {
    window.MoodyAdmin = window.MoodyAdmin || {};

    window.MoodyAdmin.initHeaderMenu = function initHeaderMenu() {
        const logo = document.querySelector('.admin-header__logo');
        const menuToggle = document.querySelector('[data-admin-user-toggle]');
        const headerMenuModal = document.getElementById('adminUserMenuPanel');

        if (logo) {
            logo.style.cursor = 'pointer';
            logo.addEventListener('click', () => {
                window.location.href = '/';
            });
        }

        function closeHeaderMenu() {
            if (!menuToggle || !headerMenuModal) {
                return;
            }

            headerMenuModal.hidden = true;
            headerMenuModal.setAttribute('hidden', 'hidden');
            menuToggle.setAttribute('aria-expanded', 'false');
        }

        function openHeaderMenu() {
            if (!menuToggle || !headerMenuModal) {
                return;
            }

            headerMenuModal.hidden = false;
            headerMenuModal.removeAttribute('hidden');
            menuToggle.setAttribute('aria-expanded', 'true');
        }

        if (!(menuToggle && headerMenuModal)) {
            return;
        }

        closeHeaderMenu();

        menuToggle.addEventListener('click', (event) => {
            event.stopPropagation();
            if (headerMenuModal.hidden) {
                openHeaderMenu();
            } else {
                closeHeaderMenu();
            }
        });

        headerMenuModal.addEventListener('click', (event) => {
            event.stopPropagation();
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                closeHeaderMenu();
            }
        });

        window.addEventListener('click', (event) => {
            const clickedInsideMenu = headerMenuModal.contains(event.target);
            const clickedToggle = menuToggle.contains(event.target);
            if (!clickedInsideMenu && !clickedToggle) {
                closeHeaderMenu();
            }
        });
    };
})();
