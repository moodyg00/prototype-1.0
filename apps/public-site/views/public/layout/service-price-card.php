<?php

require_once __DIR__ . '/../../../php/services/service-price-content.php';

$servicePriceContent = get_service_price_content((string) $service_type);
?>
<section class="price-section service-card">
    <h1>Price</h1>
    <p class="estimate-price-range"><?php echo $servicePriceContent; ?></p>
    <div class="content-center">
        <button type="button" class="btn price-section__cta" data-estimate-trigger="true" aria-haspopup="dialog">Instant Estimate Form</button>
    </div>
</section>