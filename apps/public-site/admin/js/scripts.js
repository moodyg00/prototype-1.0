document.addEventListener('DOMContentLoaded', () => {
    if (window.MoodyAdmin && typeof window.MoodyAdmin.initHeaderMenu === 'function') {
        window.MoodyAdmin.initHeaderMenu();
    }

    if (window.MoodyAdmin && typeof window.MoodyAdmin.initAdminConsole === 'function') {
        window.MoodyAdmin.initAdminConsole();
    }

    if (window.MoodyAdmin && typeof window.MoodyAdmin.initAdsManager === 'function') {
        window.MoodyAdmin.initAdsManager();
    }

    if (window.MoodyAdmin && typeof window.MoodyAdmin.initCrmManager === 'function') {
        window.MoodyAdmin.initCrmManager();
    }
});
