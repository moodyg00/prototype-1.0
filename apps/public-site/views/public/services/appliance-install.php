<?php 
$service_type = 'appliance-install'; // form handler variable to determine which form config to use

// Set the title and description for the page - Optimized for SEO
$title = "Appliance Installation Services in Austin TX | Washer, Dryer, Fridge & Oven Install";
$description = "Professional appliance installation in Austin, Cedar Park, Leander, Round Rock, Pflugerville & surrounding areas. Safe hookup for refrigerators, washers, dryers, stoves, dishwashers & more. Old appliance removal available. Starting at $100. Free quotes!";

 // add header
include __DIR__ . '/../layout/header.php';
?>
<main>
<div class="site-shell">
<section class="service-intro service-card">
    <h1>Appliance Installation Services</h1>
    <p>Got a new refrigerator, washer, dryer, stove, or dishwasher still sitting in the box? Our appliance installation experts in Austin and surrounding areas will hook it up safely and correctly the first time — so you can start using it right away without worrying about leaks, gas lines, or voided warranties.</p>
</section> 

<?php include __DIR__ . '/../layout/service-gallery.php'; ?>

<?php include __DIR__ . '/../layout/service-price-card.php'; ?>

<?php include __DIR__ . '/../layout/service-gallery.php'; ?>

<section class="service-details service-card">
    <h1>Why Professional Appliance Installation Matters</h1>
    <ul>
        <li><strong>Safety First:</strong> Proper connections prevent gas leaks, electrical hazards, and water damage in Austin homes.</li>
        <li><strong>Warranty Protection:</strong> Most manufacturers require professional installation to keep your warranty valid.</li>
        <li><strong>Optimal Performance:</strong> We ensure everything is level, properly vented, and connected for maximum efficiency.</li>
        <li><strong>Peace of Mind:</strong> No more struggling with heavy appliances or confusing manuals.</li>
    </ul>
</section>

<?php include __DIR__ . '/../layout/service-gallery.php'; ?>

<!-- <img class="service-image" src="/images/appliance-install-2.jpg" alt="Appliance Installation Services Austin"> -->

<section class="service-process service-card">
    <h1>Our Appliance Installation Process</h1>
    <ol>
        <li><strong>Site Assessment:</strong> We evaluate your space, existing hookups, electrical, gas, and water lines.</li>
        <li><strong>Preparation:</strong> We remove the old appliance (if needed) and prepare the area for the new one.</li>
        <li><strong>Installation:</strong> We carefully position, level, and securely connect your new appliance using proper techniques.</li>
        <li><strong>Testing & Cleanup:</strong> We test everything thoroughly and remove all packaging and debris.</li>
    </ol>
</section>

<?php include __DIR__ . '/../layout/service-gallery.php'; ?>

<section class="faq-section service-card">
    <h1>Frequently Asked Questions</h1>
    
    <details>
        <summary>How much does appliance installation cost in Austin?</summary>
        <p>Appliance installation in Austin typically costs between $100 and $250 per unit. Standard installations like a refrigerator, dishwasher, or electric dryer usually run $125–$175. Gas appliances, stacked washer/dryer combos, or jobs needing new hookups or old appliance removal can range from $175–$250. We provide an exact quote after seeing the job.</p>
    </details>

    <details>
        <summary>Do you offer appliance installation in Cedar Park, Leander, and Round Rock?</summary>
        <p>Yes! We provide professional appliance installation throughout Austin and all surrounding areas including Cedar Park, Leander, West Lake Hills, Bee Cave, South Austin, North Austin, East Austin, Bastrop, Kyle, Georgetown, Pflugerville, and Round Rock.</p>
    </details>

    <details>
        <summary>Is it okay to install appliances myself as a DIY project?</summary>
        <p>While some people try DIY appliance installation, it’s often risky. Improper leveling, gas connections, or electrical wiring can void warranties, cause safety hazards, or lead to expensive repairs. Professional installation protects your investment and gives you peace of mind.</p>
    </details>

    <details>
        <summary>Can you haul away my old appliance?</summary>
        <p>Yes! We offer old appliance removal and responsible disposal for an additional fee. This makes the whole process much easier and cleaner for you.</p>
    </details>

    <details>
        <summary>Do you install gas and electric appliances?</summary>
        <p>Yes. We safely install both gas and electric appliances including ranges, ovens, dryers, and water heaters. All our technicians are trained and follow local Austin-area codes.</p>
    </details>

    <details>
        <summary>How long does appliance installation take?</summary>
        <p>Most single appliance installations in the Austin area take 1–2 hours. Stacked washer/dryer units or jobs requiring new hookups may take 2–4 hours.</p>
    </details>

    <details>
        <summary>What appliances do you install?</summary>
        <p>We install refrigerators, washers, dryers, stoves, ovens, dishwashers, microwaves, garbage disposals, and wine coolers. We also handle stackable and built-in units.</p>
    </details>

    <details>
        <summary>Do you need to be home during the installation?</summary>
        <p>It’s preferred, but not always required. As long as we have access and clear instructions, we can often complete the job while you’re at work.</p>
    </details>

    <details>
        <summary>Will professional installation protect my warranty?</summary>
        <p>Yes — most manufacturers require professional installation to validate the warranty. We provide documentation of the installation for your records.</p>
    </details>

    <details>
        <summary>How soon can you install my new appliance in the Austin area?</summary>
        <p>We can usually schedule appliance installation within 1–5 business days. Same-week service is often available depending on your location in Cedar Park, Leander, Pflugerville, or Round Rock.</p>
    </details>

    <details>
        <summary>Do you install over-the-range microwaves and built-in appliances?</summary>
        <p>Yes. We specialize in installing over-the-range microwaves, built-in ovens, cooktops, and other integrated appliances with proper venting and electrical work.</p>
    </details>
</section>

<?php include __DIR__ . '/../layout/service-gallery.php'; ?>

<section class="contact-section service-card">
    <h1>Get Your Appliance Installed Today!</h1>
    <p>Don’t let your new appliance sit in the box. Contact Moody Home Services for fast, professional appliance installation in Austin, Cedar Park, Leander, Round Rock, Pflugerville, and surrounding areas.</p>
    <div class="content-center">
        <a href="<?php echo htmlspecialchars(get_public_sms_href(), ENT_QUOTES, 'UTF-8'); ?>" class="btn">Text Us Now</a>
    </div>
</section>

</div>
</main>
<?php include __DIR__ . '/../layout/service-estimate.php';?>
<?php include __DIR__ . '/../layout/footer.php';?>