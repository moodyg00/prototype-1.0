<?php
$submissionNotice = $submissionNotice ?? null;
$submissionError = $submissionError ?? null;
$pageClassName = $pageClassName ?? 'photo-submit';
?>
<main class="service-page service-page--simple">
    <section class="service-hero wrapper">
        <p class="service-eyebrow">Community Photos</p>
        <h1>Submit a Photo</h1>
        <p class="service-lead">Send a project photo to Moody Home Services. Submissions stay in moderation until they are reviewed and approved into the image library.</p>
    </section>

    <section class="wrapper">
        <?php if ($submissionNotice !== null): ?>
            <section class="admin-alert admin-alert--success" aria-live="polite"><?php echo htmlspecialchars((string) $submissionNotice, ENT_QUOTES, 'UTF-8'); ?></section>
        <?php endif; ?>

        <?php if ($submissionError !== null): ?>
            <section class="admin-alert admin-alert--error" aria-live="assertive"><?php echo htmlspecialchars((string) $submissionError, ENT_QUOTES, 'UTF-8'); ?></section>
        <?php endif; ?>

        <form class="admin-form admin-form--stacked card" method="post" enctype="multipart/form-data">
            <div class="admin-form-grid">
                <label>
                    <span>Name</span>
                    <input type="text" name="name" required>
                </label>
                <label>
                    <span>Email</span>
                    <input type="email" name="email" required>
                </label>
                <label>
                    <span>Phone</span>
                    <input type="text" name="phone">
                </label>
                <label>
                    <span>Photo file</span>
                    <input type="file" name="image_file" accept="image/*" required>
                </label>
                <label class="admin-form-grid__full">
                    <span>Alt text</span>
                    <input type="text" name="alt" placeholder="Describe what the photo shows">
                </label>
                <label class="admin-form-grid__full">
                    <span>Project notes</span>
                    <textarea name="notes" rows="5" placeholder="Tell us where the photo was taken or what project it shows."></textarea>
                </label>
                <label class="admin-form-grid__full">
                    <span>Suggested tags</span>
                    <input type="text" name="custom_tags" placeholder="kitchen, after, pressure washing">
                </label>
                <label class="admin-form-grid__full" hidden>
                    <span>Leave blank</span>
                    <input type="text" name="website">
                </label>
            </div>
            <div class="admin-form-actions">
                <button class="btn" type="submit">Submit Photo</button>
            </div>
        </form>
    </section>
</main>