<?php
require_once __DIR__ . '/php/support/render.php';

$title = 'Area We Serve | Moody Home Services';
$description = 'See the Austin-area communities Moody Home Services supports for repairs, installs, maintenance, and rental property turnover work.';

$areasServed = [
    'Austin',
    'Cedar Park',
    'Leander',
    'Round Rock',
    'Pflugerville',
    'Georgetown',
    'Bee Cave',
    'Bastrop',
    'Kyle',
    'Lakeway',
    'West Lake Hills',
    'South Austin',
    'North Austin',
    'East Austin',
];

render_public_page('area', compact('title', 'description', 'areasServed'));