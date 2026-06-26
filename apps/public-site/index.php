<?php 

require_once __DIR__ . '/php/support/render.php';

$title = "Moody Home Services | Fast Quotes by Text in Austin TX";
$description = "Text Moody Home Services for fast quotes on drywall repair, painting, pressure washing, installs, fence and deck repair, and rental turnover work in Austin and surrounding areas.";
$pageClassName = 'home-soft-sage';

render_public_page('home', compact('title', 'description', 'pageClassName'));