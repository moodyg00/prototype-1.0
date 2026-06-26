<?php 
$service_type = 'boat-detailing'; // form handler variable to determine which form config to use

// Set the title and description for the page - Optimized for SEO
$title = "Boat Detailing Services in Austin TX | Lake Travis Boat Cleaning & Polishing";
$description = "Professional boat detailing in Austin, Lake Travis, Cedar Park, Leander & surrounding areas. Hull cleaning, waxing, interior cleaning & polishing. Protect your boat from Texas sun and water. Starting at $200. Free quotes!";

 // add header
include __DIR__ . '/../layout/header.php';
?>
<main>
<div class="site-shell">
<section class="service-intro service-card">
    <h1>Boat Detailing Services</h1>
    <p>Your boat deserves to look as good as it performs. Whether it’s docked at Lake Travis, Lake Austin, or stored in the Austin area, our professional boat detailing team restores that showroom shine. We remove grime, oxidation, and water spots caused by Central Texas sun and lakes while protecting your investment from harsh UV rays and elements.</p>
</section>

<?php include __DIR__ . '/../layout/service-gallery.php'; ?>

<?php include __DIR__ . '/../layout/service-price-card.php'; ?>

<?php include __DIR__ . '/../layout/service-gallery.php'; ?>

<section class="service-details service-card">
    <h1>Our Boat Detailing Services</h1>
    <ul>
        <li><strong>Exterior Wash & Wax:</strong> Thorough cleaning and high-quality marine wax to restore shine and protect against UV damage.</li>
        <li><strong>Interior Cleaning & Sanitizing:</strong> Deep cleaning of upholstery, carpets, seats, cabinets, and all surfaces.</li>
        <li><strong>Hull Cleaning:</strong> Remove algae, barnacles, slime, and waterline stains to improve performance and appearance.</li>
        <li><strong>Polishing & Buffing:</strong> Eliminate scratches, oxidation, and dullness for a mirror-like finish.</li>
    </ul>
</section>

<?php include __DIR__ . '/../layout/service-gallery.php'; ?>

<section class="service-process service-card">
    <h1>Our Boat Detailing Process</h1>
    <ol>
        <li><strong>Assessment:</strong> We inspect your boat’s exterior, hull, and interior to create a custom detailing plan.</li>
        <li><strong>Thorough Cleaning:</strong> We wash the hull, deck, and interior, removing dirt, salt, algae, and grime.</li>
        <li><strong>Detailing & Protection:</strong> We polish, wax, and apply protective coatings to fiberglass, gelcoat, and metal surfaces.</li>
        <li><strong>Final Inspection:</strong> We do a complete walkthrough with you to ensure your boat looks and feels brand new.</li>
    </ol>
</section>

<?php include __DIR__ . '/../layout/service-gallery.php'; ?>

<section class="faq-section service-card">
    <h1>Frequently Asked Questions</h1>
    
    <details>
        <summary>How much does boat detailing cost in Austin?</summary>
        <p>Boat detailing in Austin typically costs between $200 and $500+ depending on the size and condition of the vessel. A 20–25 foot boat usually runs $300–$400. Larger boats (35–45 feet) or those with heavy oxidation, barnacle buildup, or neglected interiors can range from $450 to $700 or more. We always provide a transparent, no-surprise quote after assessing your boat at the marina or storage facility.</p>
    </details>

    <details>
        <summary>Do you detail boats at Lake Travis and Lake Austin?</summary>
        <p>Yes! We provide mobile boat detailing throughout the Austin area and regularly service boats at Lake Travis, Lake Austin, and surrounding marinas and storage facilities in Cedar Park, Leander, Pflugerville, and Round Rock.</p>
    </details>

    <details>
        <summary>How often should I get my boat detailed in Central Texas?</summary>
        <p>Most boat owners in Austin should detail their vessel 2–4 times per year. The intense Texas sun, heat, and lake water cause oxidation and staining much faster here than in other regions. Regular detailing protects your gelcoat and keeps your boat looking its best.</p>
    </details>

    <details>
        <summary>Is boat detailing hard to do as a DIY project?</summary>
        <p>Basic washing can be DIY, but professional boat detailing involves proper compounds, polishes, waxes, and techniques to avoid swirl marks or damaging gelcoat. Most Austin boat owners prefer professionals to save time and achieve superior, longer-lasting results.</p>
    </details>

    <details>
        <summary>Can you remove barnacles and algae from the hull?</summary>
        <p>Yes. We specialize in safe, effective hull cleaning to remove barnacles, algae, slime, and waterline stains that hurt performance and appearance.</p>
    </details>

    <details>
        <summary>How long does boat detailing take?</summary>
        <p>A standard 25-foot boat usually takes 4–6 hours. Larger boats or those needing heavy restoration can take 1–2 full days. We work efficiently at your marina or storage location.</p>
    </details>

    <details>
        <summary>Do you apply protective coatings and wax?</summary>
        <p>Absolutely. We use premium marine-grade wax and UV protectants to shield your boat from Central Texas sun, oxidation, and water damage.</p>
    </details>

    <details>
        <summary>Can you detail boats in storage or on a trailer?</summary>
        <p>Yes. We happily detail boats on trailers, in dry storage, or at marinas — wherever is most convenient for you.</p>
    </details>

    <details>
        <summary>What types of boats do you detail?</summary>
        <p>We detail all types including pontoons, bass boats, ski boats, yachts, sailboats, and jet skis. No job is too big or too small in the Austin area.</p>
    </details>

    <details>
        <summary>How soon can you detail my boat in the Austin area?</summary>
        <p>We can usually schedule boat detailing within 3–10 days depending on the season. Spring and early summer are our busiest times around Lake Travis — booking early is recommended.</p>
    </details>

    <details>
        <summary>Is boat detailing worth it before selling or storing for winter?</summary>
        <p>Yes — a clean, detailed boat sells faster and for more money. It’s also the best way to prepare your vessel for off-season storage to prevent long-term damage from UV rays and moisture.</p>
    </details>
</section>

<?php include __DIR__ . '/../layout/service-gallery.php'; ?>

<section class="contact-section service-card">
    <h1>Keep Your Boat Looking Showroom Ready!</h1>
    <p>Don’t let sun, water, and algae dull your investment. Contact Moody Home Services for professional boat detailing in Austin, Lake Travis, Cedar Park, Leander, and surrounding areas.</p>
    <div class="content-center">
        <a href="tel:+15123253525" class="btn">Call/Text 512-592-9226</a>
    </div>
</section>

<!-- CONTACT FORM -->
</div>
</main>
<?php include __DIR__ . '/../layout/service-estimate.php';?>
<?php include __DIR__ . '/../layout/footer.php';?>