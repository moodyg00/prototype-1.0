<?php 
$service_type = 'fence-repair'; // form handler variable to determine which form config to use

// Set the title and description for the page - Optimized for SEO
$title = "Fence Repair Services in Austin TX | Wood, Vinyl & Chain Link Fence Repair";
$description = "Professional fence repair in Austin, Cedar Park, Leander, Round Rock, Pflugerville & surrounding areas. Fix leaning fences, replace broken panels, repair gates & more. Fast, reliable service. Free quotes!";

 // add header
include __DIR__ . '/../layout/header.php';
?>
<main>
<div class="site-shell">
<section class="service-intro service-card">
    <h1>Fence Repair Services</h1>
    <p>Is your fence leaning, missing boards, or falling apart? Our fence repair experts in Austin and the surrounding areas quickly fix wood, vinyl, chain link, and metal fences so your property looks great and stays secure. We handle everything from small fixes to major structural repairs.</p>
</section>

<?php include __DIR__ . '/../layout/service-gallery.php'; ?>

<?php include __DIR__ . '/../layout/service-price-card.php'; ?>

<?php include __DIR__ . '/../layout/service-gallery.php'; ?>

<section class="service-details service-card">
    <h1>Common Fence Issues We Fix</h1>
    <ul>
        <li><strong>Leaning or Unstable Fences:</strong> We reinforce or reset posts and panels for straight, sturdy fences.</li>
        <li><strong>Broken or Missing Boards:</strong> We replace damaged wood or vinyl panels to restore privacy and appearance.</li>
        <li><strong>Rotten Wood & Decay:</strong> We remove and replace rotted sections common in Austin’s humid climate.</li>
        <li><strong>Gate Repairs:</strong> We fix sagging, broken, or hard-to-close gates for smooth operation and security.</li>
    </ul>
</section>

<?php include __DIR__ . '/../layout/service-gallery.php'; ?>

<section class="service-process service-card">
    <h1>Our Fence Repair Process</h1>
    <ol>
        <li><strong>Inspection:</strong> We thoroughly inspect your fence, posts, and gates to identify all issues.</li>
        <li><strong>Repair Plan:</strong> We discuss the best repair options and provide a transparent quote.</li>
        <li><strong>Execution:</strong> We use quality materials to repair or replace damaged sections quickly and cleanly.</li>
        <li><strong>Final Inspection:</strong> We test stability, alignment, and gate function, then walk through everything with you.</li>
    </ol>
</section>

<?php include __DIR__ . '/../layout/service-gallery.php'; ?>

<section class="faq-section service-card">
    <h1>Frequently Asked Questions</h1>
    
    <details>
        <summary>How much does fence repair cost in Austin?</summary>
        <p>Fence repair in Austin typically costs $200–$400 for minor fixes (a few boards or a gate) and $400–$800 for moderate repairs. Larger structural repairs or multiple sections can range from $800 to $2,000+. Prices depend on fence type (wood, vinyl, chain link), extent of damage, and access. We provide an accurate on-site quote after inspecting your fence.</p>
    </details>

    <details>
        <summary>Do you offer fence repair in Cedar Park, Leander, and Round Rock?</summary>
        <p>Yes! We provide professional fence repair throughout Austin and all surrounding areas including Cedar Park, Leander, West Lake Hills, Bee Cave, South Austin, North Austin, East Austin, Bastrop, Kyle, Georgetown, Pflugerville, and Round Rock.</p>
    </details>

    <details>
        <summary>Is fence repair a good DIY project?</summary>
        <p>Small fixes can sometimes be DIY, but most fence repairs in Austin are better left to professionals. Incorrect post setting, improper leveling, or using wrong materials often leads to the fence failing again quickly — especially in Central Texas clay soil and wind.</p>
    </details>

    <details>
        <summary>How long does fence repair take?</summary>
        <p>Simple repairs usually take 2–4 hours. Moderate jobs (multiple panels or gates) typically take 1 day. Larger repairs may require 1–2 days depending on the scope.</p>
    </details>

    <details>
        <summary>Can you repair leaning fences?</summary>
        <p>Yes — leaning fences are very common in Austin. We reset or reinforce posts, add concrete where needed, and straighten panels to make the fence stable again.</p>
    </details>

    <details>
        <summary>Do you repair all types of fences?</summary>
        <p>Yes. We repair wood, vinyl, chain link, aluminum, and wrought iron fences. We match existing materials as closely as possible for a seamless look.</p>
    </details>

    <details>
        <summary>When should I repair my fence instead of replacing it?</summary>
        <p>If less than 30–40% of the fence is damaged, repair is usually the smarter and more affordable option. We’ll honestly tell you whether repair or full replacement makes more sense for your property.</p>
    </details>

    <details>
        <summary>Do you fix fence gates in Austin?</summary>
        <p>Absolutely. We repair sagging gates, replace hinges and latches, fix alignment issues, and install new gates when needed. This is one of our most requested services.</p>
    </details>

    <details>
        <summary>Does weather in Central Texas cause fence damage?</summary>
        <p>Yes — heavy rains, clay soil movement, high winds, and intense sun cause posts to shift and wood to rot quickly. Regular inspections and timely repairs help avoid bigger problems.</p>
    </details>

    <details>
        <summary>How soon can you repair my fence in the Austin area?</summary>
        <p>We can usually schedule fence repairs within 2–7 business days. Emergency repairs (completely down fences or major leaning) are often prioritized faster.</p>
    </details>

    <details>
        <summary>Will you haul away the old damaged fence materials?</summary>
        <p>Yes — we remove and properly dispose of all old boards, posts, and debris so you don’t have to.</p>
    </details>
</section>

<?php include __DIR__ . '/../layout/service-gallery.php'; ?>

<section class="contact-section service-card">
    <h1>Get Your Fence Repaired Today!</h1>
    <p>Don’t let a broken or leaning fence compromise your privacy and security. Contact Moody Home Services for fast, professional fence repair in Austin, Cedar Park, Leander, Round Rock, Pflugerville, and surrounding areas.</p>
    <div class="content-center">
        <a href="<?php echo htmlspecialchars(get_public_sms_href(), ENT_QUOTES, 'UTF-8'); ?>" class="btn">Text Us Now</a>
    </div>
</section>

<!-- CONTACT FORM -->
</div>
</main>
<?php include __DIR__ . '/../layout/service-estimate.php';?>
<?php include __DIR__ . '/../layout/footer.php';?>