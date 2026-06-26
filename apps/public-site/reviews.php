<?php
require_once __DIR__ . '/php/support/render.php';

$title = 'Customer Reviews | Moody Home Services';
$description = 'Read what customers say about Moody Home Services and the repair, maintenance, and turnover work we provide across the Austin area.';

render_public_page('reviews', compact('title', 'description'));