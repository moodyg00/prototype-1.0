(function () {
  function getApiBase() {
    return window.PUBLIC_SITE_CONFIG?.adminApiBase || 'http://localhost:3001';
  }

  function setStatus(form, message, type) {
    const status = form.querySelector('[data-contact-status]');
    if (!status) return;
    status.textContent = message;
    status.hidden = !message;
    status.classList.remove('contact-form__status--error', 'contact-form__status--success');
    if (type) status.classList.add(`contact-form__status--${type}`);
  }

  function initContactForm() {
    const form = document.getElementById('publicContactForm');
    if (!form) return;

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const submitButton = form.querySelector('button[type="submit"]');
      if (submitButton) submitButton.disabled = true;
      setStatus(form, 'Sending…', null);

      try {
        const response = await fetch(`${getApiBase()}/api/public/contact`, {
          method: 'POST',
          body: new FormData(form),
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(payload.error || 'Unable to send your message right now.');
        }
        form.reset();
        setStatus(form, 'Thanks — we got your message and will follow up soon.', 'success');
      } catch (error) {
        setStatus(form, error instanceof Error ? error.message : 'Unable to send your message right now.', 'error');
      } finally {
        if (submitButton) submitButton.disabled = false;
      }
    });
  }

  window.MoodySite = window.MoodySite || {};
  window.MoodySite.initContactForm = initContactForm;
})();