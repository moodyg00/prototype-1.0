<?php
date_default_timezone_set('America/Chicago');
require_once __DIR__ . '/../../../php/support/page-classes.php';

$bodyClassName = get_admin_page_class_string($pageClassName ?? null);
$adminCurrentPage = basename((string) ($navigationCurrentPage ?? ($_SERVER['SCRIPT_NAME'] ?? 'index.php')));
$adminNavigationLinks = $navigation ?? [
    'operations' => ['title' => 'Operations', 'href' => 'operations.php'],
    'site-controls' => ['title' => 'Site Controls', 'href' => 'site-controls.php'],
    'accounting' => ['title' => 'Accounting', 'href' => 'accounting.php'],
    'marketing' => ['title' => 'Marketing', 'href' => 'marketing.php'],
    'integrations' => ['title' => 'Integrations', 'href' => 'integrations.php'],
    'images' => ['title' => 'Images', 'href' => 'images.php'],
];

$fallbackHeaderTitles = [
    'crm.php' => 'CRM - Console',
    'ads.php' => 'Ads - Console',
    'blog.php' => 'Blog - Console',
    'login.php' => 'Admin Login',
];

$navigationHeaderTitle = null;
foreach ($adminNavigationLinks as $adminNavLink) {
    if ((string) ($adminNavLink['href'] ?? '') !== $adminCurrentPage) {
        continue;
    }

    $navigationTitle = trim((string) ($adminNavLink['title'] ?? ''));
    $navigationHeaderTitle = $navigationTitle !== '' ? $navigationTitle . ' - Console' : null;
    break;
}

$headerTitle = trim((string) ($pageTitle ?? $navigationHeaderTitle ?? ($fallbackHeaderTitles[$adminCurrentPage] ?? 'Admin Console')));
$headerUserName = trim((string) ($_SESSION['user_name'] ?? 'admin'));
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="description" content="Admin Panel">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title><?php echo htmlspecialchars($headerTitle, ENT_QUOTES, 'UTF-8'); ?></title>
    <link rel="stylesheet" href="<?php echo htmlspecialchars(admin_url('css/global.css'), ENT_QUOTES, 'UTF-8'); ?>">
    <link rel="stylesheet" href="<?php echo htmlspecialchars(admin_url('css/styles.css'), ENT_QUOTES, 'UTF-8'); ?>">
    <link rel="stylesheet" href="<?php echo htmlspecialchars(admin_url('css/details.css'), ENT_QUOTES, 'UTF-8'); ?>">
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Arimo:wght@400;700&display=swap">
    <script src="<?php echo htmlspecialchars(admin_url('js/features/ads-manager.js'), ENT_QUOTES, 'UTF-8'); ?>" defer></script>
    <script src="<?php echo htmlspecialchars(admin_url('js/features/crm-manager.js'), ENT_QUOTES, 'UTF-8'); ?>" defer></script>
    <script src="<?php echo htmlspecialchars(admin_url('js/features/header-menu.js'), ENT_QUOTES, 'UTF-8'); ?>" defer></script>
    <script src="<?php echo htmlspecialchars(admin_url('js/features/admin-console.js'), ENT_QUOTES, 'UTF-8'); ?>" defer></script>
    <script src="<?php echo htmlspecialchars(admin_url('js/scripts.js'), ENT_QUOTES, 'UTF-8'); ?>" defer></script>
</head>
<body class="<?php echo htmlspecialchars($bodyClassName, ENT_QUOTES, 'UTF-8'); ?>">
    <header class="admin-header">
	    <div class="admin-header__shell">
	        <div class="admin-header__inner">
                <div class="admin-header__brand">
                    <img class="admin-header__logo" alt="Moody Home Services logo" src="/images/logo_orange.svg">
                    <h1 class="admin-header__title"><?php echo htmlspecialchars($headerTitle, ENT_QUOTES, 'UTF-8'); ?></h1>
                </div>
                <div class="admin-header__actions">
                    <?php if (function_exists('is_logged_in') && is_logged_in()): ?>
                        <div class="admin-user-menu">
                            <button class="admin-user-pill" type="button" data-admin-user-toggle aria-expanded="false" aria-controls="adminUserMenuPanel"><?php echo htmlspecialchars($headerUserName, ENT_QUOTES, 'UTF-8'); ?></button>
                            <div class="admin-user-menu__panel" id="adminUserMenuPanel" hidden>
                                <a class="admin-user-menu__link" href="<?php echo htmlspecialchars(admin_url('logout.php'), ENT_QUOTES, 'UTF-8'); ?>">Sign Out</a>
                                <a class="admin-user-menu__link" href="<?php echo htmlspecialchars(admin_url('login.php?switch=1'), ENT_QUOTES, 'UTF-8'); ?>">Switch User</a>
                            </div>
                        </div>
                    <?php endif; ?>
                </div>
	        </div>
            <nav class="admin-header__nav admin-header__nav--scroll" aria-label="Admin sections">
                <?php foreach ($adminNavigationLinks as $adminNavLink): ?>
                    <?php $isActive = $adminCurrentPage === (string) ($adminNavLink['href'] ?? ''); ?>
                    <a class="admin-header__nav-link<?php echo $isActive ? ' is-active' : ''; ?>" href="<?php echo htmlspecialchars(admin_url((string) ($adminNavLink['href'] ?? '')), ENT_QUOTES, 'UTF-8'); ?>"><?php echo htmlspecialchars((string) ($adminNavLink['title'] ?? ''), ENT_QUOTES, 'UTF-8'); ?></a>
                <?php endforeach; ?>
            </nav>
	    </div>
    </header>

