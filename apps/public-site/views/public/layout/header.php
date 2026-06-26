<?php
date_default_timezone_set('America/Chicago');
require_once __DIR__ . '/../../../php/content/site-navigation.php';
require_once __DIR__ . '/../../../php/support/contact.php';
require_once __DIR__ . '/../../../php/support/page-classes.php';

$siteNavigationLinks = get_site_navigation_links();
$bodyClassName = get_public_page_class_string($service_type ?? null, $pageClassName ?? null);
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="description" content="<?php echo htmlspecialchars($description ?? '', ENT_QUOTES, 'UTF-8'); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo htmlspecialchars($title ?? '', ENT_QUOTES, 'UTF-8'); ?></title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,300..700;1,6..72,300..700&family=Public+Sans:wght@400;600;700&display=swap">
    <link rel="stylesheet" href="css/global.css">
    <link rel="stylesheet" href="css/styles.css">
    <script src="js/public/features/page-ad-modal.js" defer></script>
    <script src="js/public/features/site-menu.js" defer></script>
    <script src="js/public/features/floating-text-button.js" defer></script>
    <script src="js/public/features/home-service-grid.js" defer></script>
    <script src="js/public/features/estimate-modal.js" defer></script>
    <script src="js/scripts.js" defer></script>
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-ME0JR3B5XS"></script>
    <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-ME0JR3B5XS');
    </script>
</head>
<body class="<?php echo htmlspecialchars($bodyClassName, ENT_QUOTES, 'UTF-8'); ?>">
    <div class="page-backdrop" aria-hidden="true">
        <div class="page-backdrop__glow page-backdrop__glow--one"></div>
        <div class="page-backdrop__glow page-backdrop__glow--two"></div>
    </div>

    <header class="site-header">
        <div class="site-header__inner">

            <a href="index.php" class="site-brand">
                <img class="site-brand__logo" src="images/logo_orange.svg" alt="Moody Home Services logo">
                <div class="site-brand__text">
                    <strong>Moody Home Services</strong>
                    <span>Austin, TX</span>
                </div>
            </a>

            <nav class="site-inline-nav" aria-label="Primary navigation">
                <?php foreach ($siteNavigationLinks as $link): ?>
                    <?php if (empty($link['children'])): ?>
                        <a href="<?php echo htmlspecialchars($link['href'], ENT_QUOTES, 'UTF-8'); ?>">
                            <?php echo htmlspecialchars($link['label'], ENT_QUOTES, 'UTF-8'); ?>
                        </a>
                    <?php endif; ?>
                <?php endforeach; ?>
            </nav>

            <div class="site-header__actions">
                <a href="<?php echo htmlspecialchars(get_public_sms_href(), ENT_QUOTES, 'UTF-8'); ?>" class="btn site-cta-btn">Text for Quote</a>

                <div class="site-menu-dock">
                    <button
                        id="siteMenuToggle"
                        class="site-menu-toggle"
                        type="button"
                        aria-label="Open site menu"
                        aria-expanded="false"
                        aria-controls="siteMenuModal"
                    >
                        <span class="site-menu-toggle-icon" aria-hidden="true">&#9776;</span>
                        <span class="site-menu-toggle-label">Menu</span>
                    </button>

                    <nav id="siteMenuModal" class="site-menu-modal" aria-label="Site navigation" hidden>
                        <?php foreach ($siteNavigationLinks as $link): ?>
                            <?php if (!empty($link['children']) && is_array($link['children'])): ?>
                                <div class="site-menu-group">
                                    <button
                                        type="button"
                                        class="site-menu-subtoggle"
                                        aria-expanded="false"
                                        aria-controls="siteServicesSubmenu"
                                    >
                                        <span><?php echo htmlspecialchars($link['label'], ENT_QUOTES, 'UTF-8'); ?></span>
                                        <span class="site-menu-chevron" aria-hidden="true">&#8250;</span>
                                    </button>
                                    <div id="siteServicesSubmenu" class="site-menu-submenu" hidden>
                                        <?php foreach ($link['children'] as $childLink): ?>
                                            <a class="site-menu-link site-menu-sublink" href="<?php echo htmlspecialchars($childLink['href'], ENT_QUOTES, 'UTF-8'); ?>">
                                                <?php echo htmlspecialchars($childLink['label'], ENT_QUOTES, 'UTF-8'); ?>
                                            </a>
                                        <?php endforeach; ?>
                                    </div>
                                </div>
                            <?php else: ?>
                                <a class="site-menu-link" href="<?php echo htmlspecialchars($link['href'], ENT_QUOTES, 'UTF-8'); ?>">
                                    <?php echo htmlspecialchars($link['label'], ENT_QUOTES, 'UTF-8'); ?>
                                </a>
                            <?php endif; ?>
                        <?php endforeach; ?>
                    </nav>
                </div>
            </div>

        </div>
    </header>

    <a class="site-floating-text-btn" href="<?php echo htmlspecialchars(get_public_sms_href(), ENT_QUOTES, 'UTF-8'); ?>" aria-label="Text Moody Home Services">
        <svg class="site-floating-text-btn__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <rect x="7" y="2.75" width="10" height="18.5" rx="2.5" ry="2.5" fill="none" stroke="currentColor" stroke-width="1.8"></rect>
            <line x1="10" y1="5.5" x2="14" y2="5.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"></line>
            <circle cx="12" cy="18.1" r="1.1" fill="currentColor"></circle>
        </svg>
    </a>
