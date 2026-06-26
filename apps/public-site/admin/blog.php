<?php
require_once __DIR__ . '/php/bootstrap.php';

$db = prepare_admin_page();
render_admin_page('blog', compact('db'));
