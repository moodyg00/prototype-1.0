<?php require_once __DIR__ . '/../partials/console-ui.php'; ?>
<main class="admin-main admin-main--console">
    <div class="wrapper admin-wrapper">
        <div class="admin-console-hero">
            <h1><?php echo htmlspecialchars((string) ($groupTitle ?? 'Console'), ENT_QUOTES, 'UTF-8'); ?></h1>
            <p class="admin-page-intro"><?php echo htmlspecialchars((string) ($groupIntro ?? ''), ENT_QUOTES, 'UTF-8'); ?></p>
        </div>

        <?php if ($noticeMessage !== null): ?>
            <section class="admin-alert admin-alert--success" aria-live="polite"><?php echo htmlspecialchars($noticeMessage, ENT_QUOTES, 'UTF-8'); ?></section>
        <?php endif; ?>

        <?php if ($errorMessage !== null): ?>
            <section class="admin-alert admin-alert--error" aria-live="assertive"><?php echo htmlspecialchars($errorMessage, ENT_QUOTES, 'UTF-8'); ?></section>
        <?php endif; ?>

        <section class="admin-console-stack">
            <?php foreach ($features as $feature): ?>
                <?php $actions = isset($feature['actions']) && is_array($feature['actions']) ? $feature['actions'] : []; ?>
                <section class="card feature-card feature-card--<?php echo htmlspecialchars((string) ($feature['card_type'] ?? 'single-action'), ENT_QUOTES, 'UTF-8'); ?>">
                    <div class="header">
                        <p class="admin-card-eyebrow"><?php echo htmlspecialchars((string) ($groupTitle ?? 'Console'), ENT_QUOTES, 'UTF-8'); ?></p>
                        <h2><?php echo htmlspecialchars((string) ($feature['title'] ?? ''), ENT_QUOTES, 'UTF-8'); ?></h2>
                        <p class="admin-card-caption"><?php echo htmlspecialchars((string) ($feature['description'] ?? ''), ENT_QUOTES, 'UTF-8'); ?></p>
                    </div>
                    <?php render_admin_console_feature_body($feature); ?>
                    <?php if ($actions !== []): ?>
                        <div class="feature-card-footer">
                            <?php foreach ($actions as $action): ?>
                                <?php render_admin_console_feature_action_button($action); ?>
                            <?php endforeach; ?>
                        </div>
                    <?php endif; ?>
                </section>
            <?php endforeach; ?>
        </section>
    </div>

    <?php if (!empty($quickModals['operations-take-payment'])): ?>
        <section class="admin-modal admin-console-modal" data-console-modal="operations-take-payment"<?php echo trim((string) ($activeModal ?? '')) === 'operations-take-payment' ? '' : ' hidden'; ?>>
            <div class="admin-modal__backdrop" data-console-modal-close></div>
            <div class="admin-modal__dialog card" role="dialog" aria-modal="true" aria-labelledby="hubTakePaymentTitle">
                <div class="admin-modal__header"><div><p class="admin-page-eyebrow">Operations</p><h2 id="hubTakePaymentTitle">Take Payment</h2></div><button class="admin-modal__close" type="button" data-console-modal-close aria-label="Close">X</button></div>
                <div class="admin-modal__body admin-console-modal__body">
                    <?php $unpaidInvoices = get_unpaid_invoice_rows(); ?>
                    <form class="admin-form admin-form--stacked admin-console-image-form" method="post">
                        <input type="hidden" name="csrf_token" value="<?php echo htmlspecialchars((string) ($_SESSION['csrf_token'] ?? ''), ENT_QUOTES, 'UTF-8'); ?>">
                        <input type="hidden" name="action" value="take_invoice_payment">
                        <div class="admin-form-grid">
                            <label class="admin-form-grid__full"><span>What invoice is this payment for?</span><select name="invoice_id" required><option value="">Select an invoice</option><?php foreach ($unpaidInvoices as $invoice): ?><option value="<?php echo htmlspecialchars((string) ($invoice['id'] ?? ''), ENT_QUOTES, 'UTF-8'); ?>"><?php echo htmlspecialchars((string) (($invoice['id'] ?? '') . ' | ' . ($invoice['title'] ?? '') . ' | $' . number_format((float) ($invoice['amount'] ?? 0), 2)), ENT_QUOTES, 'UTF-8'); ?></option><?php endforeach; ?></select></label>
                            <label><span>Amount</span><input type="number" name="payment_amount" min="0" step="0.01" placeholder="Use invoice total"></label>
                            <label><span>Payment Method</span><input type="text" name="payment_method" placeholder="Card, cash, check..."></label>
                        </div>
                        <div class="admin-form-actions"><button class="btn" type="submit">Take Payment</button></div>
                    </form>
                </div>
            </div>
        </section>
        <section class="admin-modal admin-console-modal" data-console-modal="operations-mark-paid"<?php echo trim((string) ($activeModal ?? '')) === 'operations-mark-paid' ? '' : ' hidden'; ?>>
            <div class="admin-modal__backdrop" data-console-modal-close></div>
            <div class="admin-modal__dialog card" role="dialog" aria-modal="true" aria-labelledby="hubMarkPaidTitle">
                <div class="admin-modal__header"><div><p class="admin-page-eyebrow">Operations</p><h2 id="hubMarkPaidTitle">Mark as Paid</h2></div><button class="admin-modal__close" type="button" data-console-modal-close aria-label="Close">X</button></div>
                <div class="admin-modal__body admin-console-modal__body">
                    <?php $unpaidInvoices = get_unpaid_invoice_rows(); ?>
                    <div class="admin-console-record-list">
                        <?php foreach ($unpaidInvoices as $invoice): ?>
                            <a class="admin-console-record-row admin-console-record-row--link" href="<?php echo htmlspecialchars(admin_url('features/journal.php?modal=record-editor&feature_key=journal&source_modal_id=journal&create=1&invoice=' . rawurlencode((string) ($invoice['id'] ?? '')) . '&mark_invoice_paid=1'), ENT_QUOTES, 'UTF-8'); ?>">
                                <div class="admin-console-record-row__content"><div class="admin-console-record-row__header"><h3><?php echo htmlspecialchars((string) ($invoice['title'] ?? 'Invoice'), ENT_QUOTES, 'UTF-8'); ?></h3><?php render_admin_console_badge((string) ($invoice['status'] ?? 'sent'), (string) ($invoice['status'] ?? 'default')); ?></div><p class="admin-console-record-row__meta"><?php echo htmlspecialchars(implode(' | ', array_filter([(string) ($invoice['id'] ?? ''), (string) ($invoice['customer'] ?? ''), '$' . number_format((float) ($invoice['amount'] ?? 0), 2)])), ENT_QUOTES, 'UTF-8'); ?></p></div>
                                <div class="admin-console-record-actions"><span class="btn btn--secondary admin-console-record-action">Open</span></div>
                            </a>
                        <?php endforeach; ?>
                    </div>
                </div>
            </div>
        </section>
    <?php endif; ?>
</main>