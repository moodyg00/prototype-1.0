<main>
<div class="site-shell">
    <section class="site-card">
        <h1>Area We Serve</h1>
        <p>We work across Greater Austin for home repair, handyman, property care, and make-ready projects. If you are nearby and do not see your neighborhood listed, reach out anyway and we can confirm availability.</p>
    </section>

    <section class="site-card">
        <h2>Service Area</h2>
        <ul class="location-list">
            <?php foreach ($areasServed as $areaName): ?>
                <li><?php echo htmlspecialchars($areaName, ENT_QUOTES, 'UTF-8'); ?></li>
            <?php endforeach; ?>
        </ul>
    </section>

</div>
</main>
