<?php

function ensure_login_user_email_column(PDO $db): void {
    static $checked = false;
    if ($checked) {
        return;
    }

    $stmt = $db->query("SHOW COLUMNS FROM login_user LIKE 'email'");
    $column = $stmt ? $stmt->fetch(PDO::FETCH_ASSOC) : false;
    if ($column === false) {
        $db->exec("ALTER TABLE login_user ADD COLUMN email VARCHAR(255) NULL AFTER username");
    }

    $checked = true;
}

function get_user_by_username(PDO $db, string $username): ?array {
    ensure_login_user_email_column($db);
    $stmt = $db->prepare('SELECT id, username, email, password FROM login_user WHERE username = ?');
    $stmt->execute([$username]);

    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    return $user ?: null;
}

function get_user_by_email(PDO $db, string $email): ?array {
    ensure_login_user_email_column($db);
    $stmt = $db->prepare('SELECT id, username, email, password FROM login_user WHERE email = ?');
    $stmt->execute([$email]);

    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    return $user ?: null;
}

function get_user_by_login(PDO $db, string $login): ?array {
    ensure_login_user_email_column($db);
    $stmt = $db->prepare('SELECT id, username, email, password FROM login_user WHERE username = ? OR email = ? LIMIT 1');
    $stmt->execute([$login, $login]);

    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    return $user ?: null;
}

function get_user_by_id(PDO $db, int $id): ?array {
    ensure_login_user_email_column($db);
    $stmt = $db->prepare('SELECT id, username, email FROM login_user WHERE id = ?');
    $stmt->execute([$id]);

    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    return $user ?: null;
}

function get_admin_users(PDO $db): array {
    ensure_login_user_email_column($db);
    $stmt = $db->query('SELECT id, username, email FROM login_user ORDER BY username ASC');
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    return is_array($users) ? $users : [];
}

function create_admin_user(PDO $db, string $username, string $password, string $email = ''): array {
    ensure_login_user_email_column($db);
    $normalizedUsername = trim($username);
    $normalizedEmail = trim($email);
    if ($normalizedUsername === '') {
        throw new InvalidArgumentException('Username is required.');
    }

    if ($normalizedEmail === '' || !filter_var($normalizedEmail, FILTER_VALIDATE_EMAIL)) {
        throw new InvalidArgumentException('Email is required.');
    }

    if (strlen($password) < 8) {
        throw new InvalidArgumentException('Password must be at least 8 characters.');
    }

    if (get_user_by_username($db, $normalizedUsername) !== null) {
        throw new InvalidArgumentException('That username already exists.');
    }

    if (get_user_by_email($db, $normalizedEmail) !== null) {
        throw new InvalidArgumentException('That email address already exists.');
    }

    $stmt = $db->prepare('INSERT INTO login_user (username, email, password) VALUES (?, ?, ?)');
    $stmt->execute([$normalizedUsername, $normalizedEmail, password_hash($password, PASSWORD_DEFAULT)]);

    return get_user_by_id($db, (int) $db->lastInsertId()) ?? ['id' => (int) $db->lastInsertId(), 'username' => $normalizedUsername, 'email' => $normalizedEmail];
}
