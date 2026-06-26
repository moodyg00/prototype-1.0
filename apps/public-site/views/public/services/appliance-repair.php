<?php 
$service_type = 'appliance-repair';

$title = "Appliance Repair Services in Austin TX | Washer, Dryer, Fridge, Oven & Dishwasher Repair";
$description = "Professional appliance repair in Austin, Cedar Park, Leander, Round Rock, Pflugerville & surrounding areas. Fast repairs for refrigerators, washers, dryers, ovens, dishwashers and more. Honest pricing and free quotes.";

include __DIR__ . '/../layout/header.php';
?>
<main>
<div class="site-shell">
<section class="service-intro service-card">
    <h1>Appliance Repair Services</h1>
    <p>If your appliance is leaking, not heating, not cooling, or just not working right, we can help. Our appliance repair service covers common household units across Austin and nearby cities so you can get back to normal quickly without replacing a machine that may still have life left.</p>
</section>

<?php include __DIR__ . '/../layout/service-gallery.php'; ?>

<?php include __DIR__ . '/../layout/service-price-card.php'; ?>

<?php include __DIR__ . '/../layout/service-gallery.php'; ?>

<section class="service-details service-card">
    <h1>Why Fast Appliance Repair Matters</h1>
    <ul>
        <li><strong>Avoid Bigger Damage:</strong> Small issues can become expensive failures if ignored.</li>
        <li><strong>Protect Your Home:</strong> Leaks, overheating, and electrical issues can cause property damage.</li>
        <li><strong>Save Money:</strong> Repair is often more affordable than full replacement.</li>
        <li><strong>Stay on Schedule:</strong> Working appliances keep your household running smoothly.</li>
    </ul>
</section>

<?php include __DIR__ . '/../layout/service-gallery.php'; ?>

<section class="service-process service-card">
    <h1>Common Appliance Repairs We Handle</h1>
    <ul>
        <li>Washer not draining or spinning</li>
        <li>Dryer not heating or taking too long to dry</li>
        <li>Refrigerator not cooling properly</li>
        <li>Dishwasher not cleaning or leaking</li>
        <li>Oven/range burner or heating issues</li>
        <li>Garbage disposal jams and replacement</li>
    </ul>
</section>

<?php include __DIR__ . '/../layout/service-gallery.php'; ?>

<section class="service-process service-card">
    <h1>Our Appliance Repair Process</h1>
    <ol>
        <li><strong>Diagnosis:</strong> We inspect the unit and identify the root problem.</li>
        <li><strong>Quote:</strong> You get a clear repair recommendation and pricing.</li>
        <li><strong>Repair:</strong> We complete the repair safely and test operation.</li>
        <li><strong>Final Check:</strong> We confirm performance and review next steps with you.</li>
    </ol>
</section>

<?php include __DIR__ . '/../layout/service-gallery.php'; ?>

<section class="faq-section service-card">
    <h1>Frequently Asked Questions</h1>

    <details>
        <summary>How much does appliance repair cost in Austin?</summary>
        <p>Most appliance repairs range from $100 to $350 depending on the unit, issue, and parts needed. Minor fixes are often on the lower end, while heating/cooling component repairs can cost more.</p>
    </details>

    <details>
        <summary>Do you service areas outside Austin?</summary>
        <p>Yes. We serve Austin plus nearby communities including Cedar Park, Leander, Pflugerville, Round Rock, Bee Cave, and more.</p>
    </details>

    <details>
        <summary>Do you repair all appliance brands?</summary>
        <p>We work on most major household appliance brands and standard residential models.</p>
    </details>

    <details>
        <summary>Is it better to repair or replace my appliance?</summary>
        <p>It depends on age, condition, and repair cost. We give a practical recommendation so you can make the best decision.</p>
    </details>

    <details>
        <summary>Can you repair leaking appliances?</summary>
        <p>Yes. We regularly repair leaks in washers, dishwashers, refrigerators, and related connections.</p>
    </details>

    <details>
        <summary>How quickly can you schedule service?</summary>
        <p>In most cases we can schedule within a few business days, and sometimes sooner depending on location and availability.</p>
    </details>

    <details>
        <summary>Do you provide parts?</summary>
        <p>When parts are needed, we can source common replacement parts or install customer-provided compatible parts.</p>
    </details>

    <details>
        <summary>Do you handle gas and electric units?</summary>
        <p>Yes, we handle both gas and electric appliances and follow proper safety practices and local code considerations.</p>
    </details>

    <details>
        <summary>Can I troubleshoot it myself first?</summary>
        <p>You can check power, breakers, and obvious resets, but avoid deeper DIY repairs that may create safety risks.</p>
    </details>

    <details>
        <summary>How do I request a quote?</summary>
        <p>Use the estimate form below or text us at 512-592-9226 with your appliance type and issue details.</p>
    </details>
</section>

<section class="contact-section service-card">
    <h1>Need Appliance Repair?</h1>
    <p>Contact Moody Home Services for fast, reliable appliance repair in Austin and surrounding areas.</p>
    <div class="content-center">
    <a href="<?php echo htmlspecialchars(get_public_sms_href(), ENT_QUOTES, 'UTF-8'); ?>" class="btn">Text Us Now</a>
    </div>
</section>

</div>
</main>
<?php include __DIR__ . '/../layout/service-estimate.php';?>
<?php include __DIR__ . '/../layout/footer.php';?>
