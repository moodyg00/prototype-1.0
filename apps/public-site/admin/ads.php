<?php
require_once __DIR__ . '/php/bootstrap.php';
require_once __DIR__ . '/php/features/ads-page.php';
require_once __DIR__ . '/php/features/image-library-upload.php';
require_once __DIR__ . '/../php/repositories/ads.php';
require_once __DIR__ . '/../php/repositories/image-library.php';

$db = prepare_admin_page();
$error = null;
$notice = trim((string) ($_GET['notice'] ?? ''));
$activeModal = trim((string) ($_GET['modal'] ?? ''));
$selectedGroupKey = trim((string) ($_GET['group'] ?? 'index'));
$selectedAdId = trim((string) ($_GET['id'] ?? ''));
$isCreating = isset($_GET['new']);
$pickedImageSrc = trim((string) ($_GET['picked_image'] ?? ''));
$pickedImageAlt = trim((string) ($_GET['picked_alt'] ?? ''));
$postAction = '';
$adGroups = get_ad_group_catalog();

if (!in_array($activeModal, ['ad', 'images'], true)) {
    $activeModal = '';
}

if (!isset($adGroups[$selectedGroupKey])) {
    $selectedGroupKey = 'index';
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    assert_valid_csrf_token($_POST['csrf_token'] ?? null);
    $action = trim((string) ($_POST['action'] ?? 'save'));
    $postAction = $action;
    $selectedGroupKey = trim((string) ($_POST['group_key'] ?? $selectedGroupKey));
    $selectedAdId = trim((string) ($_POST['id'] ?? ''));
    $isCreating = $selectedAdId === '';

    try {
        if ($action === 'delete') {
            $deletedGroupKey = delete_ad_record($selectedAdId);
            header('Location: ads.php?group=' . rawurlencode($deletedGroupKey) . '&notice=deleted');
            exit;
        }

        if ($action === 'upload_image') {
            $uploadedImage = store_uploaded_image_library_image($_FILES['image_file'] ?? [], [
                'image_alt' => trim((string) ($_POST['image_alt'] ?? '')),
                'selected_tags' => $_POST['selected_tags'] ?? [],
                'custom_tags' => trim((string) ($_POST['custom_tags'] ?? '')),
            ]);

            header('Location: ' . build_ads_admin_return_url(
                $selectedGroupKey,
                $selectedAdId,
                $isCreating,
                [
                    'notice' => 'uploaded',
                    'modal' => 'ad',
                    'picked_image' => (string) ($uploadedImage['src'] ?? ''),
                    'picked_alt' => (string) ($uploadedImage['alt'] ?? ''),
                ]
            ));
            exit;
        }

        $savedAd = save_ad_record($_POST);
        $savedNotice = $selectedAdId === '' ? 'created' : 'saved';
        header('Location: ads.php?group=' . rawurlencode((string) $savedAd['group_key']) . '&id=' . rawurlencode((string) $savedAd['id']) . '&notice=' . $savedNotice);
        exit;
    } catch (Throwable $throwable) {
        $error = $throwable->getMessage();
    }
}

if ($error !== null) {
    $activeModal = $postAction === 'upload_image' ? 'images' : 'ad';
}

$adsByGroup = get_ads_records_grouped();

$selectedAd = resolve_selected_ad_record($selectedGroupKey, $selectedAdId, $isCreating, $error, $_POST);

if ($pickedImageSrc !== '') {
    $selectedAd['image_src'] = $pickedImageSrc;
    if ($pickedImageAlt !== '') {
        $selectedAd['image_alt'] = $pickedImageAlt;
    }
}

$selectedGroupKey = (string) ($selectedAd['group_key'] ?? $selectedGroupKey);
$selectedGroup = $adGroups[$selectedGroupKey] ?? $adGroups['index'];
$pageClassName = 'ads';
$noticeMessage = build_ads_notice_message($notice);
$imageTagCatalog = get_image_library_tag_catalog();
$imageLibraryImages = get_image_library_images();
$adsSummary = count_ads_summary($adsByGroup);
$totalAds = $adsSummary['totalAds'];
$activeAds = $adsSummary['activeAds'];

render_admin_page('ads', compact(
    'db',
    'error',
    'noticeMessage',
    'adGroups',
    'adsByGroup',
    'selectedAd',
    'selectedGroup',
    'selectedGroupKey',
    'activeModal',
    'totalAds',
    'activeAds',
    'imageTagCatalog',
    'imageLibraryImages',
    'pageClassName'
));