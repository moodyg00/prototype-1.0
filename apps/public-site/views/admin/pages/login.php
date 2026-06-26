<main class="admin-main admin-main--login">
    <div class="wrapper admin-wrapper admin-auth-wrapper">
        <section class="card admin-auth-card">
            <p class="admin-page-eyebrow">Admin Access</p>
            <h1>Login</h1>
            <p class="admin-page-intro">Sign in to manage ads, content, and the next generation of CRM and invoicing tools.</p>
            <?php if (!empty($notice)): ?>
                <div class="admin-alert admin-alert--success"><?php echo htmlspecialchars((string) $notice, ENT_QUOTES, 'UTF-8'); ?></div>
            <?php endif; ?>
            <form class="login-form" method="post">
            <div class="form-group">
                <label for="username">Username or Email</label>
                <input type="text" id="username" name="username" required>
            </div>
            <div class="form-group">
                <label for="password">Password</label>
                <input type="password" id="password" name="password" required>
            </div>
            <div class="button-center">
                <button type="submit">Login</button>
            </div>
            <?php if (isset($error)) echo "<div class='admin-alert admin-alert--error'>$error</div>"; ?>
            </form>
            <p class="admin-page-intro"><button class="btn btn--secondary" type="button" data-console-modal-open="login-password-reset">Forgot password?</button></p>
        </section>

        <section class="admin-modal admin-console-modal" data-console-modal="login-password-reset"<?php echo !empty($showResetModal) ? '' : ' hidden'; ?>>
            <div class="admin-modal__backdrop" data-console-modal-close></div>
            <div class="admin-modal__dialog card" role="dialog" aria-modal="true" aria-labelledby="loginResetTitle">
                <div class="admin-modal__header">
                    <div>
                        <p class="admin-page-eyebrow">Admin Access</p>
                        <h2 id="loginResetTitle">Reset Password</h2>
                    </div>
                    <button class="admin-modal__close" type="button" data-console-modal-close aria-label="Close">X</button>
                </div>
                <div class="admin-modal__body admin-console-modal__body">
                    <form class="admin-form admin-form--stacked" method="post">
                        <input type="hidden" name="csrf_token" value="<?php echo htmlspecialchars((string) ($_SESSION['csrf_token'] ?? ''), ENT_QUOTES, 'UTF-8'); ?>">
                        <input type="hidden" name="action" value="request_password_reset_login">
                        <div class="admin-form-grid">
                            <label>
                                <span>Email</span>
                                <input type="email" name="email" required>
                            </label>
                        </div>
                        <div class="admin-form-actions">
                            <button class="btn" type="submit">Send Code</button>
                        </div>
                    </form>
                </div>
            </div>
        </section>
    </div>
</main>
