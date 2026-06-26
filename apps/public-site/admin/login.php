<?php
require_once __DIR__ . '/php/bootstrap.php';
require_once __DIR__ . '/../php/repositories/admin-console.php';

$db = prepare_admin_page(false);
$error = null;
$notice = null;
$showResetModal = isset($_GET['reset']) || (($_POST['action'] ?? '') === 'request_password_reset_login');

if (isset($_GET['switch']) && is_logged_in()) {
    logout_user('login.php');
}

if (is_logged_in()) {
    header('Location: operations.php');
    exit;
}
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (($_POST['action'] ?? '') === 'request_password_reset_login') {
        assert_valid_csrf_token($_POST['csrf_token'] ?? null);
        $email = trim((string) ($_POST['email'] ?? ''));
        if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $error = 'Enter a valid email address.';
            $showResetModal = true;
        } elseif (get_user_by_email($db, $email) === null) {
            $error = 'No admin user is using that email address.';
            $showResetModal = true;
        } else {
            $code = strtoupper(substr(bin2hex(random_bytes(3)), 0, 6));
            save_admin_console_record('password-reset-requests', [
                'id' => 'reset-' . bin2hex(random_bytes(4)),
                'title' => $email,
                'status' => 'code-issued',
                'code' => $code,
                'updated_at' => date('Y-m-d H:i:s'),
            ]);
            $notice = 'Password reset code issued for ' . $email . '.';
            $showResetModal = true;
        }
    } else {
        $username = $_POST['username'] ?? '';
        $password = $_POST['password'] ?? '';
        if (login_user($db, $username, $password)) {
            set_logged_in_user_vars($db);
            header('Location: operations.php');
            exit;
        }

        $error = 'Invalid username or password';
    }
}
render_admin_page('login', compact('db', 'error', 'notice', 'showResetModal'));
