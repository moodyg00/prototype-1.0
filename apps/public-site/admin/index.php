<?php
require_once __DIR__ . '/php/bootstrap.php';

prepare_admin_page();
header('Location: operations.php');
exit;