(function () {
  function isLocalDevHost(hostname) {
    return (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      /^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
      /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
      hostname.endsWith('.local')
    );
  }

  const hostname = window.location.hostname;
  const isLocalDev = isLocalDevHost(hostname);
  const metaApiBase = document.querySelector('meta[name="admin-api-base"]')?.getAttribute('content')?.trim();

  window.PUBLIC_SITE_CONFIG = {
    adminApiBase:
      metaApiBase ||
      (isLocalDev ? `${window.location.protocol}//${hostname}:3001` : 'https://admin.yourdomain.com'),
  };
})();