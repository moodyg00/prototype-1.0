#!/usr/bin/env node
/**
 * One-time migration: legacy PHP views → static HTML in apps/public-site/dev/
 * Run: node scripts/migrate-public-site-static.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const LEGACY = path.join(ROOT, 'apps/public-site');
const OUT = path.join(LEGACY, 'dev');

const SMS_BODY = '**attach images for best quote** Description:';
const SMS_HREF = `sms:+15123253525?&body=${encodeURIComponent(SMS_BODY)}`;
const YEAR = new Date().getFullYear();

const SERVICES = [
  { slug: 'pressure-washing', label: 'Pressure Washing', href: 'pressure-washing.html' },
  { slug: 'gutter-cleaning', label: 'Gutter Cleaning', href: 'gutter-cleaning.html' },
  { slug: 'tv-mounting', label: 'TV Mounting', href: 'tv-mounting.html' },
  { slug: 'boat-detailing', label: 'Boat Detailing', href: 'boat-detailing.html' },
];

const PRICE_CONTENT = {
  'pressure-washing':
    '<strong>$150–$400</strong> depending on house size and surface type. A typical 1,500 sq ft single-story home usually runs around $250. Larger two-story homes or properties with heavy mold can reach $350–$400.',
  'gutter-cleaning':
    '<strong>$150–$300</strong> depending on house size, number of stories, and gutter condition. A typical single-story home usually costs around $200. Two-story homes or heavily clogged gutters cost more.',
  'tv-mounting':
    '<strong>$100–$300</strong> depending on TV size, wall type, and mounting complexity. A standard 40–55 inch TV usually costs around $150. Larger TVs or complex installations with additional wiring or mounts can reach $300.',
  'boat-detailing':
    '<strong>$200–$500+</strong> depending on boat size and condition. A typical 20–25 foot boat usually costs $300–$400. Larger 35–45 foot boats or heavily oxidized vessels can range from $450–$700+. We provide a clear quote after seeing your boat.',
};

const PRIMARY_IMAGES = {
  'pressure-washing': { src: 'images/pressure-washing-1.jpg', alt: 'Pressure washing service in Austin TX' },
  'gutter-cleaning': { src: 'images/gutter-cleaning.jpg', alt: 'Professional gutter cleaning in Austin TX' },
  'tv-mounting': { src: 'images/tv-mounting.jpg', alt: 'Professional TV mounting in Austin TX' },
  'boat-detailing': { src: 'images/boat-detailing-1.jpg', alt: 'Professional boat detailing on Lake Travis Austin TX' },
};

const GENERAL_USE_POOL = [3, 6, 9, 12, 15, 18, 20, 23, 24, 27, 29, 32, 34, 36];

function getGalleryImages(serviceType) {
  const label = serviceType.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  const images = [];
  if (PRIMARY_IMAGES[serviceType]) {
    images.push(PRIMARY_IMAGES[serviceType]);
  }
  const hash = createHash('md5').update(serviceType).digest();
  const offset = hash.readUInt32BE(0) % GENERAL_USE_POOL.length;
  for (let i = 0; images.length < 5 && i < GENERAL_USE_POOL.length; i++) {
    const n = GENERAL_USE_POOL[(offset + i) % GENERAL_USE_POOL.length];
    images.push({
      src: `images/general_use-${n}.jpg`,
      alt: `${label} project photo ${images.length + 1}`,
    });
  }
  return images.slice(0, 5);
}

function galleryImg(image) {
  return `<img class="service-image" src="${image.src}" alt="${image.alt}">`;
}

function priceSection(serviceType) {
  return `<section class="price-section service-card">
    <h1>Price</h1>
    <p class="estimate-price-range">${PRICE_CONTENT[serviceType]}</p>
    <div class="content-center">
        <a href="${SMS_HREF}" class="btn price-section__cta">Text for Quote</a>
    </div>
</section>`;
}

function headerNav() {
  const topLinks = [
    { href: 'index.html', label: 'Home' },
    { href: 'contact.html', label: 'Contact' },
    { href: 'blog.html', label: 'Blog' },
    { href: 'about.html', label: 'About' },
    { href: 'area.html', label: 'Area We Serve' },
    { href: 'reviews.html', label: 'Reviews' },
  ];
  const topNav = topLinks.map((l) => `<a href="${l.href}">${l.label}</a>`).join('\n                        ');
  const serviceLinks = SERVICES.map(
    (s) => `<a class="site-menu-link site-menu-sublink" href="${s.href}">${s.label}</a>`,
  ).join('\n                                        ');
  const menuLinks = topLinks
    .map((l) => `<a class="site-menu-link" href="${l.href}">${l.label}</a>`)
    .join('\n                                ');

  return { topNav, serviceLinks, menuLinks };
}

function pageShell({ title, description, bodyClass = '', main, extraHead = '', extraScripts = '' }) {
  const { topNav, serviceLinks, menuLinks } = headerNav();
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="description" content="${description}">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,300..700;1,6..72,300..700&family=Public+Sans:wght@400;600;700&display=swap">
    <link rel="stylesheet" href="css/global.css">
    <link rel="stylesheet" href="css/styles.css">
    ${extraHead}
    <script src="js/public/features/page-ad-modal.js" defer></script>
    <script src="js/public/features/site-menu.js" defer></script>
    <script src="js/public/features/floating-text-button.js" defer></script>
    <script src="js/public/features/home-service-grid.js" defer></script>
    <script src="js/scripts.js" defer></script>
    ${extraScripts}
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-ME0JR3B5XS"></script>
    <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-ME0JR3B5XS');
    </script>
</head>
<body class="${bodyClass}">
    <div class="page-backdrop" aria-hidden="true">
        <div class="page-backdrop__glow page-backdrop__glow--one"></div>
        <div class="page-backdrop__glow page-backdrop__glow--two"></div>
    </div>

    <header class="site-header">
        <div class="site-header__inner">
            <a href="index.html" class="site-brand">
                <img class="site-brand__logo" src="images/logo_orange.svg" alt="Moody Home Services logo">
                <div class="site-brand__text">
                    <strong>Moody Home Services</strong>
                    <span>Austin, TX</span>
                </div>
            </a>

            <nav class="site-inline-nav" aria-label="Primary navigation">
                ${topNav}
            </nav>

            <div class="site-header__actions">
                <a href="${SMS_HREF}" class="btn site-cta-btn">Text for Quote</a>
                <div class="site-menu-dock">
                    <button id="siteMenuToggle" class="site-menu-toggle" type="button" aria-label="Open site menu" aria-expanded="false" aria-controls="siteMenuModal">
                        <span class="site-menu-toggle-icon" aria-hidden="true">&#9776;</span>
                        <span class="site-menu-toggle-label">Menu</span>
                    </button>
                    <nav id="siteMenuModal" class="site-menu-modal" aria-label="Site navigation" hidden>
                        <div class="site-menu-group">
                            <button type="button" class="site-menu-subtoggle" aria-expanded="false" aria-controls="siteServicesSubmenu">
                                <span>Services</span>
                                <span class="site-menu-chevron" aria-hidden="true">&#8250;</span>
                            </button>
                            <div id="siteServicesSubmenu" class="site-menu-submenu" hidden>
                                ${serviceLinks}
                            </div>
                        </div>
                        ${menuLinks}
                    </nav>
                </div>
            </div>
        </div>
    </header>

    <a class="site-floating-text-btn" href="${SMS_HREF}" aria-label="Text Moody Home Services">
        <svg class="site-floating-text-btn__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <rect x="7" y="2.75" width="10" height="18.5" rx="2.5" ry="2.5" fill="none" stroke="currentColor" stroke-width="1.8"></rect>
            <line x1="10" y1="5.5" x2="14" y2="5.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"></line>
            <circle cx="12" cy="18.1" r="1.1" fill="currentColor"></circle>
        </svg>
    </a>

    ${main}

    <footer class="site-footer">
        <div class="site-footer__inner">
            <div class="site-footer__brand">
                <img class="site-footer__logo" src="images/logo_orange.svg" alt="Moody Home Services logo">
                <div class="site-footer__brand-text">
                    <strong>Moody Home Services</strong>
                    <p>Serving Austin, Cedar Park, Leander,<br>Round Rock &amp; surrounding areas.</p>
                </div>
            </div>
            <div>
                <p class="site-footer__nav-heading">Pages</p>
                <nav class="site-footer__nav" aria-label="Footer navigation">
                    <a href="index.html">Home</a>
                    <a href="blog.html">Blog</a>
                    <a href="about.html">About</a>
                    <a href="area.html">Area We Serve</a>
                    <a href="reviews.html">Reviews</a>
                    <a href="contact.html">Contact</a>
                </nav>
            </div>
            <div>
                <p class="site-footer__contact-heading">Contact</p>
                <div class="site-footer__contact">
                    <a href="${SMS_HREF}">512-592-9226</a>
                    <span>Text or call for a free quote</span>
                    <span>Austin, TX</span>
                </div>
            </div>
        </div>
        <div class="site-footer__legal">
            <p>&copy; ${YEAR} Moody Home Services. All rights reserved.</p>
        </div>
    </footer>
</body>
</html>`;
}

function processServicePhp(filePath, serviceType) {
  let content = fs.readFileSync(filePath, 'utf8');
  const gallery = getGalleryImages(serviceType);
  let galleryIndex = 0;

  content = content.replace(/<\?php[\s\S]*?\?>\s*/g, '');
  content = content.replace(/<\?php include[^;]+;\s*\?>/g, '');
  content = content.replace(/include __DIR__[^;]+;/g, '');

  content = content.replace(
    /<\?php include __DIR__ \. '\/\.\.\/layout\/service-gallery\.php'; \?>/g,
    () => {
      const img = gallery[galleryIndex++];
      return img ? `\n${galleryImg(img)}\n` : '';
    },
  );

  // After PHP strip, gallery includes are gone — inject by marker sections
  const parts = content.split(/<\?php include __DIR__[^>]+service-gallery\.php[^>]*\?>/);
  if (parts.length === 1) {
    // already stripped — use regex for remaining include comments
    content = content.replace(/<!-- ESTIMATE FORM -->|<!-- CONTACT FORM -->/g, '');
  }

  // Re-read raw and process includes before strip
  content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(/<\?php[\s\S]*?include __DIR__[^;]+header\.php[\s\S]*?\?>/, '');
  content = content.replace(/<\?php include __DIR__[^;]+service-estimate\.php;\s*\?>/, '');
  content = content.replace(/<\?php include __DIR__[^;]+footer\.php;\s*\?>/, '');

  galleryIndex = 0;
  content = content.replace(/<\?php include __DIR__ \. '\/\.\.\/layout\/service-gallery\.php'; \?>/g, () => {
    const img = gallery[galleryIndex++];
    return img ? `\n${galleryImg(img)}\n` : '';
  });

  content = content.replace(
    /<\?php include __DIR__ \. '\/\.\.\/layout\/service-price-card\.php'; \?>/g,
    `\n${priceSection(serviceType)}\n`,
  );

  content = content.replace(/<\?php echo htmlspecialchars\(get_public_sms_href\(\)[^;]+;\s*\?>/g, SMS_HREF);
  content = content.replace(/<\?php[\s\S]*?\?>/g, '');
  content = content.replace(/<!-- ESTIMATE FORM -->|<!-- CONTACT FORM -->/g, '');

  return content.trim();
}

function writePage(filename, html) {
  fs.writeFileSync(path.join(OUT, filename), html);
  console.log('wrote', filename);
}

// Home
writePage(
  'index.html',
  pageShell({
    title: 'Moody Home Services | Austin TX Home Services',
    description:
      'Pressure washing, gutter cleaning, TV mounting, and boat detailing in Austin and surrounding areas. Text us a photo for a fast quote.',
    bodyClass: 'page-home home-v1',
    main: `<main>
    <div class="site-shell home-v1">
        <section class="site-card home-v1__hero">
            <p class="home-v1__eyebrow">No long form. No phone tag.</p>
            <h1>Send a photo. Get a quote.</h1>
            <div class="home-v1__hero-media">
                <img class="home-v1__hero-image" src="images/general_use-20.jpg" alt="Contractor cutting lumber on a job site">
            </div>
            <p class="home-v1__lead">For pressure washing, gutter cleaning, TV mounting, and boat detailing, the easiest way to start is a text. Show us what needs work and we will help you sort out the next step.</p>
            <div class="home-v1__hero-row">
                <a class="btn" href="${SMS_HREF}">Text us Now</a>
                <span>Serving Austin and surrounding areas</span>
            </div>
        </section>
        <img class="home-v1__section-image" src="images/general_use-24.jpg" alt="Marking a wood panel for a project cut">
        <section class="home-v1__proof">
            <article class="home-v1__panel">
                <h2>For homeowners</h2>
                <p>Get help with exterior cleaning, installs, and detailing that keep getting pushed to next weekend.</p>
            </article>
            <article class="home-v1__panel">
                <h2>For landlords</h2>
                <p>Property care handled with one clear contact.</p>
            </article>
            <article class="home-v1__panel">
                <h2>For property managers</h2>
                <p>Better communication, fewer handoffs, and a faster start on practical work.</p>
            </article>
        </section>
        <img class="home-v1__section-image" src="images/general_use-29.jpg" alt="Using a drill during interior assembly work">
        <section class="home-v1__steps">
            <article class="home-v1__panel home-v1__step">
                <div class="home-v1__step-badge"><span class="home-v1__step-label">Step</span><strong>1</strong></div>
                <h3>Text the issue</h3>
                <p>One line is enough to start.</p>
            </article>
            <article class="home-v1__panel home-v1__step">
                <div class="home-v1__step-badge"><span class="home-v1__step-label">Step</span><strong>2</strong></div>
                <h3>Share photos</h3>
                <p>Helpful for exteriors, mounts, and finish details.</p>
            </article>
            <article class="home-v1__panel home-v1__step">
                <div class="home-v1__step-badge"><span class="home-v1__step-label">Step</span><strong>3</strong></div>
                <h3>Get the plan</h3>
                <p>We respond with what comes next.</p>
            </article>
        </section>
        <img class="home-v1__section-image" src="images/general_use-36.jpg" alt="Contractor cutting trim pieces inside a bright room">
        <section class="home-v1__details">
            <article class="home-v1__panel home-v1__detail-card">
                <h2>What we handle</h2>
                <p>Pressure washing, gutter cleaning, TV mounting, and boat detailing across the Austin area.</p>
            </article>
            <article class="home-v1__panel home-v1__detail-card home-v1__detail-card--cta">
                <h2>What to text</h2>
                <p>Text the issue and a few clear photos. Helpful details include what needs work, roughly how big the area is, and anything unusual like height or access problems.</p>
                <a class="btn" href="${SMS_HREF}">Send Text</a>
            </article>
        </section>
    </div>
</main>`,
  }),
);

const placeholderMain = `<main>
<div class="site-shell">
    <section class="site-card site-placeholder">
        <p class="site-placeholder__message">This page is under construction, check back soon.</p>
    </section>
</div>
</main>`;

for (const [file, title, desc] of [
  ['about.html', 'About | Moody Home Services', 'About Moody Home Services in Austin TX.'],
  ['reviews.html', 'Reviews | Moody Home Services', 'Customer reviews for Moody Home Services.'],
  ['blog.html', 'Blog | Moody Home Services', 'Tips and updates from Moody Home Services.'],
]) {
  writePage(file, pageShell({ title, description: desc, main: placeholderMain }));
}

const areas = [
  'Austin', 'Cedar Park', 'Leander', 'Round Rock', 'Pflugerville', 'Georgetown',
  'Bee Cave', 'Bastrop', 'Kyle', 'Lakeway', 'West Lake Hills', 'South Austin', 'North Austin', 'East Austin',
];
writePage(
  'area.html',
  pageShell({
    title: 'Area We Serve | Moody Home Services',
    description: 'See the Austin-area communities Moody Home Services supports.',
    main: `<main>
<div class="site-shell">
    <section class="site-card">
        <h1>Area We Serve</h1>
        <p>We work across Greater Austin for exterior cleaning, installs, and detailing. If you are nearby and do not see your neighborhood listed, reach out anyway and we can confirm availability.</p>
    </section>
    <section class="site-card">
        <h2>Service Area</h2>
        <ul class="location-list">${areas.map((a) => `<li>${a}</li>`).join('')}</ul>
    </section>
</div>
</main>`,
  }),
);

const serviceMeta = {
  'pressure-washing': {
    title: 'Pressure Washing Services in Austin TX | House & Driveway Cleaning',
    description:
      "Professional pressure washing in Austin and surrounding areas. Restore your home's exterior, remove mold, dirt, and grime. Starting at $150. Free quotes!",
    bodyClass: 'page-service page-pressure-washing',
  },
  'gutter-cleaning': {
    title: 'Gutter Cleaning Services in Austin TX | Professional Gutter Cleaners',
    description:
      'Expert gutter cleaning in Austin and surrounding areas. Remove debris, prevent water damage. Starting at $150. Free quotes!',
    bodyClass: 'page-service page-gutter-cleaning',
  },
  'tv-mounting': {
    title: 'TV Mounting Services in Austin TX | Professional Wall Mount Installation',
    description: 'Expert TV mounting in Austin and surrounding areas. Secure installation and cable hiding. Starting at $100. Free quotes!',
    bodyClass: 'page-service page-tv-mounting',
  },
  'boat-detailing': {
    title: 'Boat Detailing Services in Austin TX | Lake Travis Boat Cleaning & Polishing',
    description: 'Professional boat detailing in Austin and Lake Travis. Hull cleaning, waxing, and polishing. Starting at $200. Free quotes!',
    bodyClass: 'page-service page-boat-detailing',
  },
};

for (const service of SERVICES) {
  const viewPath = path.join(LEGACY, 'views/public/services', `${service.slug}.php`);
  const main = processServicePhp(viewPath, service.slug);
  const meta = serviceMeta[service.slug];
  writePage(
    service.href,
    pageShell({ title: meta.title, description: meta.description, bodyClass: meta.bodyClass, main }),
  );
}

writePage(
  'contact.html',
  pageShell({
    title: 'Contact | Moody Home Services',
    description: 'Contact Moody Home Services in Austin TX. Text us for the fastest quote or send project details and photos.',
    bodyClass: 'page-contact',
    extraHead: '<link rel="stylesheet" href="css/public-estimate.css">',
    extraScripts: `<script src="js/public/config.js" defer></script>
    <script src="js/public/features/contact-form.js" defer></script>`,
    main: `<main>
<div class="site-shell">
    <section class="site-card">
        <h1>Contact Us</h1>
        <p>The fastest way to get a quote is still a text. Send photos and a short description and we will reply with next steps.</p>
        <div class="content-center" style="margin-top: 1rem;">
            <a class="btn" href="${SMS_HREF}">Text for Quote</a>
        </div>
    </section>

    <section class="site-card estimate-modal__content">
        <h2>Send project details</h2>
        <p class="estimate-invite">Prefer a form? Share your contact info, notes, and photos below.</p>
        <form id="publicContactForm" class="estimate-form" novalidate>
            <input type="text" name="website" tabindex="-1" autocomplete="off" hidden aria-hidden="true">
            <div class="estimate-form__grid">
                <div class="estimate-form__field">
                    <label for="contact_name">Name</label>
                    <input id="contact_name" name="name" type="text" autocomplete="name">
                </div>
                <div class="estimate-form__field">
                    <label for="contact_email">Email</label>
                    <input id="contact_email" name="email" type="email" autocomplete="email">
                </div>
                <div class="estimate-form__field">
                    <label for="contact_phone">Phone</label>
                    <input id="contact_phone" name="phone" type="tel" autocomplete="tel">
                </div>
                <div class="estimate-form__field">
                    <label for="contact_title">Title</label>
                    <input id="contact_title" name="title" type="text" autocomplete="organization-title">
                </div>
                <div class="estimate-form__field">
                    <label for="contact_service">Service</label>
                    <select id="contact_service" name="service">
                        <option value="">General inquiry</option>
                        <option value="pressure-washing">Pressure Washing</option>
                        <option value="gutter-cleaning">Gutter Cleaning</option>
                        <option value="tv-mounting">TV Mounting</option>
                        <option value="boat-detailing">Boat Detailing</option>
                    </select>
                </div>
                <div class="estimate-form__field estimate-form__field--full">
                    <label for="contact_notes">Notes</label>
                    <textarea id="contact_notes" name="notes" rows="5" placeholder="Tell us what you need help with."></textarea>
                </div>
                <div class="estimate-form__field estimate-form__field--full">
                    <label for="contact_photos">Photos</label>
                    <input id="contact_photos" name="photos" type="file" accept="image/*" multiple>
                    <p class="estimate-invite">You can attach up to 10 images (10 MB each).</p>
                </div>
            </div>
            <div class="content-center" style="margin-top: 1rem;">
                <button type="submit" class="btn">Send message</button>
            </div>
            <p class="contact-form__status" data-contact-status hidden></p>
        </form>
    </section>
</div>
</main>`,
  }),
);

console.log('Migration complete.');