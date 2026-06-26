document.addEventListener('DOMContentLoaded', () => {
    if (window.MoodySite && typeof window.MoodySite.initSiteMenu === 'function') {
        window.MoodySite.initSiteMenu();
    }

    if (window.MoodySite && typeof window.MoodySite.initFloatingTextButton === 'function') {
        window.MoodySite.initFloatingTextButton();
    }

    if (window.MoodySite && typeof window.MoodySite.initHomeServiceGrid === 'function') {
        window.MoodySite.initHomeServiceGrid();
    }

    if (window.MoodySite && typeof window.MoodySite.initEstimateModal === 'function') {
        window.MoodySite.initEstimateModal();
    }

    if (window.MoodySite && typeof window.MoodySite.initPageAdModal === 'function') {
        window.MoodySite.initPageAdModal();
    }
});
