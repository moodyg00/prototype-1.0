window.PUBLIC_SITE_CONFIG = {
  adminApiBase:
    window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? 'http://localhost:3001'
      : 'https://admin.yourdomain.com',
};