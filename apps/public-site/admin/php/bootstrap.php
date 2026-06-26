<?php

require_once __DIR__ . '/../../php/db.php';
require_once __DIR__ . '/auth/admin-auth.php';
require_once __DIR__ . '/support/render.php';

function admin_url(string $path = ''): string {
	$path = ltrim($path, '/');
	return $path === '' ? '/admin/' : '/admin/' . $path;
}
