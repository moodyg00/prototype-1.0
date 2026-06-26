<?php
function get_db(): PDO {
    static $db = null;

    if ($db instanceof PDO) {
        return $db;
    }

    $host = getenv('PUBLIC_SITE_DB_HOST') ?: '127.0.0.1';
    $port = getenv('PUBLIC_SITE_DB_PORT') ?: '5432';
    $dbname = getenv('PUBLIC_SITE_DB_DATABASE') ?: 'app_lab_phase1_main';
    $user = getenv('PUBLIC_SITE_DB_USERNAME') ?: 'grant';
    $pass = getenv('PUBLIC_SITE_DB_PASSWORD') ?: '';
    $dsn = sprintf('pgsql:host=%s;port=%s;dbname=%s', $host, $port, $dbname);

    try {
        $db = new PDO($dsn, $user, $pass, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);
        return $db;
    } catch (PDOException $e) {
        die('Connection failed: ' . $e->getMessage());
    }
}