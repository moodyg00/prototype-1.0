<?php

require_once __DIR__ . '/php/support/render.php';
require_once __DIR__ . '/admin/php/features/image-library-upload.php';
require_once __DIR__ . '/php/repositories/lead_intake.php';

$title = 'Submit a Photo | Moody Home Services';
$description = 'Send a project photo to Moody Home Services for review and possible use in the public image library.';
$pageClassName = 'photo-submit';
$submissionNotice = null;
$submissionError = null;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        if (trim((string) ($_POST['website'] ?? '')) !== '') {
            throw new InvalidArgumentException('Invalid submission.');
        }

        $name = trim((string) ($_POST['name'] ?? ''));
        $email = trim((string) ($_POST['email'] ?? ''));
        $phone = trim((string) ($_POST['phone'] ?? ''));
        $notesText = trim((string) ($_POST['notes'] ?? ''));
        $altText = trim((string) ($_POST['alt'] ?? ''));
        $customTags = trim((string) ($_POST['custom_tags'] ?? ''));

        store_public_image_submission($_FILES['image_file'] ?? [], [
            'name' => $name,
            'email' => $email,
            'phone' => $phone,
            'notes' => $notesText,
            'alt' => $altText,
            'custom_tags' => $customTags,
        ]);

        try {
            create_lead_intake_from_payload([
                'name' => $name,
                'email' => $email,
                'phone' => $phone,
                'source' => 'website_organic',
                'origin' => 'website-photo-submission',
                'title' => 'Photo submission',
                'service_type' => '',
                'service_label' => 'Photo submission',
                'additional_notes' => $notesText,
                'extra_fields' => [
                    'photo_alt' => $altText,
                    'custom_tags' => $customTags,
                ],
            ]);
        } catch (Throwable $leadError) {
            error_log('submit-photo lead intake: ' . $leadError->getMessage());
        }

        $submissionNotice = 'Photo submitted. It is now waiting for review.';
    } catch (Throwable $throwable) {
        $submissionError = $throwable->getMessage();
    }
}

render_public_page('photo-submit', compact('title', 'description', 'pageClassName', 'submissionNotice', 'submissionError'));
