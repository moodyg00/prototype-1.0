<?php 
$service_type = 'door-repair'; // form handler variable to determine which form config to use

// Set the title and description for the page - Optimized for SEO
$title = "Door Repair Services in Austin TX | Sticky Doors, Locks & Frame Repair";
$description = "Professional door repair in Austin, Cedar Park, Leander, Round Rock, Pflugerville & surrounding areas. Fix sticking doors, broken locks, damaged frames & hardware. Fast, reliable service. Starting at $100. Free quotes!";

 // add header
include __DIR__ . '/../layout/header.php';
?>
<main>
<div class="site-shell">
<section class="service-intro service-card">
    <h1>Door Repair Services</h1>
    <p>Sticking doors, broken locks, squeaky hinges, or damaged frames? Our door repair experts in Austin and the surrounding areas fix them quickly so your doors open and close smoothly, securely, and quietly again.</p>
</section> 

<?php include __DIR__ . '/../layout/service-gallery.php'; ?>

<?php include __DIR__ . '/../layout/service-price-card.php'; ?>

<?php include __DIR__ . '/../layout/service-gallery.php'; ?>

<section class="service-details service-card">
    <h1>Why Professional Door Repair Matters</h1>
    <ul>
        <li><strong>Home Security:</strong> Properly working locks and doors keep your Austin home safe.</li>
        <li><strong>Energy Efficiency:</strong> Fixed doors stop air leaks and help lower your utility bills.</li>
        <li><strong>Better Curb Appeal:</strong> Straight, smooth doors improve the look of your home.</li>
        <li><strong>Daily Convenience:</strong> No more struggling with sticky doors or slamming issues.</li>
    </ul>
</section>

<?php include __DIR__ . '/../layout/service-gallery.php'; ?>

<section class="service-process service-card">
    <h1>Our Door Repair Process</h1>
    <ol>
        <li><strong>Assessment:</strong> We inspect the door, frame, hinges, and hardware to identify all problems.</li>
        <li><strong>Parts & Materials:</strong> We source high-quality replacement parts when needed.</li>
        <li><strong>Repair:</strong> We fix or adjust hinges, locks, strikes, frames, and weatherstripping.</li>
        <li><strong>Testing & Adjustment:</strong> We test the door multiple times to ensure it operates smoothly, latches properly, and seals correctly.</li>
    </ol>
</section>

<?php include __DIR__ . '/../layout/service-gallery.php'; ?>

<section class="faq-section service-card">
    <h1>Frequently Asked Questions</h1>
    
    <details>
        <summary>How much does door repair cost in Austin?</summary>
        <p>Door repair in Austin typically costs between $100 and $500. Minor issues like hinge adjustment or lock lubrication usually run $100–$175. More involved repairs such as fixing a damaged door frame, replacing locks, or aligning doors often cost $250–$500. We always give you an exact quote after inspecting the door at your home.</p>
    </details>

    <details>
        <summary>Do you offer door repair in Cedar Park, Leander, and Round Rock?</summary>
        <p>Yes! We provide professional door repair throughout Austin and all surrounding areas including Cedar Park, Leander, West Lake Hills, Bee Cave, South Austin, North Austin, East Austin, Bastrop, Kyle, Georgetown, Pflugerville, and Round Rock.</p>
    </details>

    <details>
        <summary>Is fixing a sticking door hard to do DIY?</summary>
        <p>Some minor sticking issues can be attempted DIY, but most door problems in Austin homes involve warped frames, settling foundations, or worn hardware that are tricky to fix properly. Incorrect repairs often make the problem return quickly or create new issues.</p>
    </details>

    <details>
        <summary>Can you fix broken door frames?</summary>
        <p>Yes. We repair split, cracked, or rotted door frames and can replace sections when needed. This is a very common service in older Austin and Round Rock homes.</p>
    </details>

    <details>
        <summary>Do you repair interior and exterior doors?</summary>
        <p>Absolutely. We repair both interior doors (bedroom, bathroom, closet) and exterior doors (front doors, back doors, garage entry doors).</p>
    </details>

    <details>
        <summary>How long does door repair take?</summary>
        <p>Most single door repairs in the Austin area take 1–3 hours. More complex jobs involving frame work or multiple doors may take half a day.</p>
    </details>

    <details>
        <summary>Can you fix or replace door locks?</summary>
        <p>Yes. We repair, rekey, and replace deadbolts, doorknobs, and smart locks. We also fix misaligned strikes that cause locking problems.</p>
    </details>

    <details>
        <summary>Why are doors in Austin homes always sticking or hard to close?</summary>
        <p>Central Texas clay soil expands and contracts with moisture changes, causing foundations and frames to shift. High humidity can also cause wood doors to swell. Professional realignment and adjustments solve this effectively.</p>
    </details>

    <details>
        <summary>Do you adjust doors for better energy efficiency?</summary>
        <p>Yes. We replace weatherstripping, adjust thresholds, and fix gaps to improve sealing and lower your heating and cooling costs.</p>
    </details>

    <details>
        <summary>How soon can you repair my door in the Austin area?</summary>
        <p>We can usually schedule door repairs within 1–5 business days. Many customers in Cedar Park, Leander, Pflugerville, and Round Rock get same-week service.</p>
    </details>

    <details>
        <summary>Should I repair my door or replace it entirely?</summary>
        <p>We’ll honestly tell you what makes the most sense. Many doors can be repaired affordably, but severely damaged or very old doors are sometimes better replaced.</p>
    </details>
</section>

<?php include __DIR__ . '/../layout/service-gallery.php'; ?>

<section class="contact-section service-card">
    <h1>Get Your Door Repaired Today!</h1>
    <p>Don’t put up with sticky, noisy, or insecure doors. Contact Moody Home Services for fast, professional door repair in Austin, Cedar Park, Leander, Round Rock, Pflugerville, and surrounding areas.</p>
    <div class="content-center">
        <a href="<?php echo htmlspecialchars(get_public_sms_href(), ENT_QUOTES, 'UTF-8'); ?>" class="btn">Text Us Now</a>
    </div>
</section>

</div>
</main>
<?php include __DIR__ . '/../layout/service-estimate.php';?>
<?php include __DIR__ . '/../layout/footer.php';?>