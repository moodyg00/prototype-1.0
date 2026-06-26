<?php

function prepare_admin_page(bool $requiresLogin = true): PDO {
    $db = get_db();

    if ($requiresLogin) {
        set_logged_in_user_vars($db);
        require_login();
    }

    return $db;
}

function render_admin_page(string $viewName, array $variables = []): void {
    extract($variables, EXTR_SKIP);

    include __DIR__ . '/../../../views/admin/layout/header.php';
    include __DIR__ . '/../../../views/admin/pages/' . $viewName . '.php';
    include __DIR__ . '/../../../views/admin/layout/footer.php';
}
