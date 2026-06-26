<?php

require_once __DIR__ . '/../../../php/content/public-page-ads.php';

$pageAdContent = get_public_page_ad_content($service_type ?? null);

if ($pageAdContent === null) {
    return;
}
?>
<div id="pageAdModal" class="page-ad-modal" hidden>
    <div class="page-ad-modal__backdrop" data-page-ad-close="true"></div>
    <div class="page-ad-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="pageAdTitle" aria-describedby="pageAdBody">
        <section class="page-ad-modal__content">
            <button type="button" class="page-ad-modal__close" aria-label="Close advertisement" data-page-ad-close="true">&times;</button>

            <div class="page-ad-modal__media">
                <img
                    class="page-ad-modal__image"
                    src="<?php echo htmlspecialchars((string) $pageAdContent['image']['src'], ENT_QUOTES, 'UTF-8'); ?>"
                    alt="<?php echo htmlspecialchars((string) $pageAdContent['image']['alt'], ENT_QUOTES, 'UTF-8'); ?>"
                >
            </div>

            <div class="page-ad-modal__body">
                <h2 id="pageAdTitle"><?php echo htmlspecialchars((string) $pageAdContent['headline'], ENT_QUOTES, 'UTF-8'); ?></h2>
                <p id="pageAdBody" class="page-ad-modal__body-copy"><?php echo htmlspecialchars((string) $pageAdContent['problem'], ENT_QUOTES, 'UTF-8'); ?>, <?php echo htmlspecialchars((string) $pageAdContent['solution'], ENT_QUOTES, 'UTF-8'); ?>.</p>

                <p class="page-ad-modal__offer"><?php echo htmlspecialchars((string) $pageAdContent['offer'], ENT_QUOTES, 'UTF-8'); ?></p>

                <div class="page-ad-modal__actions">
                    <a class="btn page-ad-modal__cta" href="<?php echo htmlspecialchars((string) $pageAdContent['cta_href'], ENT_QUOTES, 'UTF-8'); ?>">
                        <?php echo htmlspecialchars((string) $pageAdContent['cta_label'], ENT_QUOTES, 'UTF-8'); ?>
                    </a>
                </div>
            </div>
        </section>
    </div>
</div>