<?php

function render_public_page(string $viewName, array $variables = []): void {
    extract($variables, EXTR_SKIP);

    include __DIR__ . '/../../views/public/layout/header.php';
    include __DIR__ . '/../../views/public/pages/' . $viewName . '.php';
    include __DIR__ . '/../../views/public/layout/footer.php';
}
