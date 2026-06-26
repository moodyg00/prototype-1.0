<?php

require_once __DIR__ . '/../repositories/admin-users.php';

function ensure_admin_session_started(): void {
    if (session_status() !== PHP_SESSION_ACTIVE) {
        session_start();
    }
}

function ensure_csrf_token(): void {
    ensure_admin_session_started();

    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
}

function is_valid_csrf_token(?string $token): bool {
    ensure_admin_session_started();

    return is_string($token)
        && $token !== ''
        && !empty($_SESSION['csrf_token'])
        && hash_equals($_SESSION['csrf_token'], $token);
}

function assert_valid_csrf_token(?string $token): void {
    if (!is_valid_csrf_token($token)) {
        http_response_code(403);
        exit('Invalid CSRF token.');
    }
}

function login_user(PDO $db, string $username, string $password): bool {
    ensure_admin_session_started();

    $user = get_user_by_login($db, trim($username));
    if ($user !== null && password_verify($password, (string) $user['password'])) {
        $_SESSION['user_id'] = (int) $user['id'];
        return true;
    }

    return false;
}

function is_logged_in(): bool {
    ensure_admin_session_started();
    return isset($_SESSION['user_id']);
}

function require_login(string $loginUrl = 'login.php'): void {
    if (!is_logged_in()) {
        header('Location: ' . $loginUrl);
        exit;
    }
}

function set_logged_in_user_vars(PDO $db): void {
    ensure_admin_session_started();

    if (!is_logged_in()) {
        unset($_SESSION['user_name']);
        return;
    }

    $user = get_user_by_id($db, (int) $_SESSION['user_id']);
    $_SESSION['user_name'] = $user['username'] ?? 'Unknown';
}

function logout_user(string $redirectUrl = '../login.php'): void {
    ensure_admin_session_started();

    $_SESSION = [];

    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(
            session_name(),
            '',
            time() - 42000,
            $params['path'],
            $params['domain'],
            $params['secure'],
            $params['httponly']
        );
    }

    session_destroy();

    header('Location: ' . $redirectUrl);
    exit;
}

ensure_admin_session_started();
ensure_csrf_token();

$currentScript = realpath($_SERVER['SCRIPT_FILENAME'] ?? '');
if ($currentScript !== false && $currentScript === __FILE__ && isset($_GET['logout'])) {
    logout_user('../login.php');
}
