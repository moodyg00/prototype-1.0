<?php
require_once __DIR__ . '/php/support/render.php';

$title = 'About Moody Home Services | Local Home Repair Team';
$description = 'Learn about Moody Home Services, our approach to home repair, and the way we help Austin-area homeowners and landlords keep properties in great shape.';

render_public_page('about', compact('title', 'description'));