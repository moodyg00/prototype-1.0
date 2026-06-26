<?php 
$service_type = 'property-turnover'; // form handler variable to determine which form config to use

// Set the title and description for the page - Optimized for SEO
$title = "Rental Property Turnover Services in Austin TX | Make-Ready Services";
$description = "Professional rental property turnover & make-ready services in Austin, Cedar Park, Leander, Round Rock, Pflugerville & surrounding areas. Repairs, deep cleaning, inspections, rekeying & junk removal. Get your property rent-ready fast. Free quotes!";

 // add header
include __DIR__ . '/../layout/header.php';
?>
<main>
<div class="site-shell">
    <section class="service-card">
        <h1>Rental Property Turnover Services</h1>
        <p>Managing tenant move-outs is stressful and time-consuming. Our professional rental property turnover service in Austin handles everything — repairs, deep cleaning, inspections, rekeying, and junk removal — so your rental is rent-ready quickly and looks its best for the next tenant.</p>
    </section>

    <?php include __DIR__ . '/../layout/service-gallery.php'; ?>

    <?php include __DIR__ . '/../layout/service-price-card.php'; ?>

    <?php include __DIR__ . '/../layout/service-gallery.php'; ?>

    <section class="service-card">
        <h2 class="content-section-heading">Why Choose Our Rental Turnover Service?</h2>
        <p><strong>Out-of-Town & Busy Landlords:</strong> We act as your trusted local team with detailed photo reports, clear communication, and single-point accountability.</p>
        <p><strong>Minimize Vacancy Time:</strong> Our coordinated process gets your property market-ready faster, reducing expensive vacant days.</p>
        <p><strong>Protect Your Investment:</strong> Thorough inspections and professional repairs help preserve property value and support strong security deposit claims.</p>
        <p><strong>Quality Tenants:</strong> A clean, well-maintained property attracts better tenants who are willing to pay higher rent.</p>
    </section>

    <?php include __DIR__ . '/../layout/service-gallery.php'; ?>

    <section class="service-card">
        <h2 class="content-section-heading">Our Comprehensive Turnover Process</h2>
        
        <h3>1. Detailed Move-Out Inspection</h3>
        <p>We perform a thorough walkthrough with photos and notes, documenting damage vs. normal wear and tear.</p>
        
        <h3>2. Repairs & Maintenance</h3>
        <p>Drywall repair, painting, plumbing, electrical, flooring, door/lock fixes, appliance service, and more.</p>
        
        <h3>3. Professional Deep Cleaning</h3>
        <p>Kitchen, bathrooms, floors, windows, baseboards, carpets, and all surfaces — move-in ready clean.</p>
        
        <h3>4. Rekeying & Security</h3>
        <p>New locks, key distribution, garage codes, and lockbox setup for safe tenant transition.</p>
        
        <h3>5. Junk Removal & Final Walkthrough</h3>
        <p>Complete debris removal and a final inspection with before/after photos and full documentation for you.</p>
    </section>

    <?php include __DIR__ . '/../layout/service-gallery.php'; ?>

    <section class="service-card">
        <h2 class="content-section-heading">Specialized Services</h2>
        <p><strong>Emergency & Expedited Turnovers</strong> — Fast turnaround when you need it.<br>
        <strong>Pre-Listing & Selling Prep</strong> — Get your property showing-ready.<br>
        <strong>Recurring Maintenance Programs</strong> — For seasonal or student rentals.</p>
    </section>

    <?php include __DIR__ . '/../layout/service-gallery.php'; ?>

    <section class="faq-section service-card">
        <h1>Frequently Asked Questions</h1>
        
        <details>
            <summary>How much does rental property turnover cost in Austin?</summary>
            <p>Rental property turnover in Austin typically costs between $500 and $2,000 depending on the size of the property and the amount of repairs and cleaning needed. A standard 2–3 bedroom house usually runs $750–$1,400. We provide a transparent, itemized quote after the move-out inspection.</p>
        </details>

        <details>
            <summary>What is rental property turnover or "make-ready" service?</summary>
            <p>Property turnover (also called make-ready service) is the full process of preparing a rental for the next tenant after move-out. It includes inspection, repairs, deep cleaning, rekeying, junk removal, and final documentation so the property is clean, safe, and rent-ready as quickly as possible.</p>
        </details>

        <details>
            <summary>Do you serve Cedar Park, Leander, Round Rock, and Pflugerville?</summary>
            <p>Yes! We provide full rental property turnover services throughout Austin and all surrounding areas including Cedar Park, Leander, West Lake Hills, Bee Cave, South Austin, North Austin, East Austin, Bastrop, Kyle, Georgetown, Pflugerville, and Round Rock.</p>
        </details>

        <details>
            <summary>How long does a typical property turnover take in Austin?</summary>
            <p>Most turnovers are completed in 3–7 days. Simple jobs can be done in 2–4 days, while properties needing major repairs or painting may take 7–10 days. We work efficiently to minimize vacancy time.</p>
        </details>

        <details>
            <summary>Can you help with security deposit disputes?</summary>
            <p>Yes. We provide detailed move-out inspection reports with timestamped photos that clearly document tenant-caused damage vs. normal wear and tear — very helpful for deposit claims.</p>
        </details>

        <details>
            <summary>Do you handle junk removal and old tenant belongings?</summary>
            <p>Absolutely. We remove and properly dispose of all trash, abandoned furniture, appliances, and debris left behind.</p>
        </details>

        <details>
            <summary>Do you rekey or change locks after every tenant?</summary>
            <p>Yes — this is standard with every turnover for maximum security. We can also install smart locks if requested.</p>
        </details>

        <details>
            <summary>What’s the difference between turnover and regular cleaning?</summary>
            <p>Turnover includes deep cleaning plus repairs, painting touch-ups, rekeying, and full inspection. Regular cleaning is much lighter and does not include repairs or maintenance work.</p>
        </details>

        <details>
            <summary>Do you work with property management companies in Austin?</summary>
            <p>Yes. We partner with many local property managers and landlords, providing reliable, consistent turnover services with detailed reporting.</p>
        </details>

        <details>
            <summary>Can you prepare a property for sale or new listing?</summary>
            <p>Absolutely. Many landlords use our service for pre-listing prep, including repairs, deep cleaning, minor upgrades, and staging recommendations.</p>
        </details>

        <details>
            <summary>How soon after move-out can you start the turnover?</summary>
            <p>We can usually begin the same or next day after the tenant moves out. Expedited service is available when you need the property back on the market quickly.</p>
        </details>

        <details>
            <summary>Is rental property turnover worth it for landlords in Austin?</summary>
            <p>Yes. Professional turnover reduces vacancy time, helps you charge higher rent, protects your property value, and makes tenant transitions much smoother.</p>
        </details>
    </section>

    <section class="contact-section service-card">
        <h1>Get Your Rental Property Turned Over Fast!</h1>
        <p>Ready to get your property rent-ready quickly and professionally? Contact Moody Home Services for reliable rental turnover and make-ready services in Austin and surrounding areas.</p>
        <div class="content-center">
            <a href="<?php echo htmlspecialchars(get_public_sms_href(), ENT_QUOTES, 'UTF-8'); ?>" class="btn">Text Us Now</a>
        </div>
    </section>

    <!-- CONTACT FORM -->
</div>
</main>
<?php include __DIR__ . '/../layout/service-estimate.php';?>
<?php include __DIR__ . '/../layout/footer.php';?>