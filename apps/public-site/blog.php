<?php
require_once __DIR__ . '/php/support/render.php';

$title = 'Blog | Moody Home Services';
$description = 'Updates, project notes, and service advice from Moody Home Services.';

render_public_page('blog', compact('title', 'description'));