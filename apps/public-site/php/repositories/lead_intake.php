<?php

require_once __DIR__ . '/../db.php';

const LEAD_INTAKE_ALLOWED_SOURCES = [
    'website_organic',
    'facebook',
    'instagram',
    'craigslist',
    'nextdoor',
    'referral',
    'physical_media',
    'in_person',
];

function normalize_lead_intake_payload(array $payload): array {
    $name = trim((string) ($payload['name'] ?? ''));
    $email = strtolower(trim((string) ($payload['email'] ?? '')));
    $phone = trim((string) ($payload['phone'] ?? ''));

    if ($name === '' && $email === '' && $phone === '') {
        throw new InvalidArgumentException('At least one of name, email, or phone is required.');
    }

    if ($email !== '' && filter_var($email, FILTER_VALIDATE_EMAIL) === false) {
        throw new InvalidArgumentException('That email address is not valid.');
    }

    $source = (string) ($payload['source'] ?? 'website_organic');
    if (!in_array($source, LEAD_INTAKE_ALLOWED_SOURCES, true)) {
        $source = 'website_organic';
    }

    $city = trim((string) ($payload['city'] ?? $payload['location'] ?? ''));
    $state = trim((string) ($payload['state'] ?? ''));
    $address = [];
    if ($city !== '') {
        $address['city'] = $city;
    }
    if ($state !== '') {
        $address['state'] = $state;
    }

    return [
        'name' => $name !== '' ? $name : null,
        'email' => $email !== '' ? $email : null,
        'phone' => $phone !== '' ? $phone : null,
        'address' => $address !== [] ? $address : null,
        'source' => $source,
        'title' => trim((string) ($payload['title'] ?? '')),
        'service_type' => trim((string) ($payload['service_type'] ?? '')),
        'service_label' => trim((string) ($payload['service_label'] ?? '')),
        'origin' => trim((string) ($payload['origin'] ?? 'website-estimate-form')),
        'additional_notes' => trim((string) ($payload['additional_notes'] ?? '')),
        'extra_fields' => is_array($payload['extra_fields'] ?? null) ? $payload['extra_fields'] : [],
    ];
}

function find_existing_contact_id(PDO $db, ?string $email, ?string $phone): ?string {
    if ($email === null && $phone === null) {
        return null;
    }

    $sql = "SELECT id FROM contacts WHERE ";
    $conditions = [];
    $bindings = [];

    if ($email !== null) {
        $conditions[] = "lower(email) = :email";
        $bindings[':email'] = $email;
    }
    if ($phone !== null) {
        $conditions[] = "phone = :phone";
        $bindings[':phone'] = $phone;
    }

    $sql .= implode(' OR ', $conditions);
    $sql .= " ORDER BY created_at ASC LIMIT 1";

    $stmt = $db->prepare($sql);
    foreach ($bindings as $key => $value) {
        $stmt->bindValue($key, $value, PDO::PARAM_STR);
    }
    $stmt->execute();

    $id = $stmt->fetchColumn();
    return $id !== false && $id !== null ? (string) $id : null;
}

function insert_lead_intake_contact(PDO $db, array $payload, string $nowIso): string {
    $contactNotes = [
        'first_inquiry_at' => $nowIso,
        'first_inquiry_source' => $payload['origin'],
    ];

    $sql = 'INSERT INTO contacts (name, email, phone, address, type, status, source, notes, tags, last_contacted_at, created_at, updated_at)
            VALUES (:name, :email, :phone, :address, :type, :status, :source, :notes, :tags, :ts, :ts, :ts)
            RETURNING id';

    $stmt = $db->prepare($sql);
    $stmt->bindValue(':name', $payload['name'], $payload['name'] === null ? PDO::PARAM_NULL : PDO::PARAM_STR);
    $stmt->bindValue(':email', $payload['email'], $payload['email'] === null ? PDO::PARAM_NULL : PDO::PARAM_STR);
    $stmt->bindValue(':phone', $payload['phone'], $payload['phone'] === null ? PDO::PARAM_NULL : PDO::PARAM_STR);
    $stmt->bindValue(':address', $payload['address'] === null ? null : json_encode($payload['address'], JSON_UNESCAPED_SLASHES), $payload['address'] === null ? PDO::PARAM_NULL : PDO::PARAM_STR);
    $stmt->bindValue(':type', 'other', PDO::PARAM_STR);
    $stmt->bindValue(':status', 'active', PDO::PARAM_STR);
    $stmt->bindValue(':source', $payload['origin'], PDO::PARAM_STR);
    $stmt->bindValue(':notes', json_encode($contactNotes, JSON_UNESCAPED_SLASHES), PDO::PARAM_STR);
    $stmt->bindValue(':tags', json_encode(['website-lead'], JSON_UNESCAPED_SLASHES), PDO::PARAM_STR);
    $stmt->bindValue(':ts', $nowIso, PDO::PARAM_STR);
    $stmt->execute();

    $id = $stmt->fetchColumn();
    if ($id === false || $id === null) {
        throw new RuntimeException('Failed to create contact record.');
    }
    return (string) $id;
}

function touch_existing_contact(PDO $db, string $contactId, string $nowIso): void {
    $sql = "UPDATE contacts
            SET last_contacted_at = :ts,
                updated_at = :ts,
                tags = CASE
                    WHEN tags IS NULL THEN to_jsonb(ARRAY['website-lead']::text[])
                    WHEN NOT (tags @> to_jsonb(ARRAY['website-lead']::text[])) THEN tags || to_jsonb(ARRAY['website-lead']::text[])
                    ELSE tags
                END
            WHERE id = :id";

    $stmt = $db->prepare($sql);
    $stmt->bindValue(':ts', $nowIso, PDO::PARAM_STR);
    $stmt->bindValue(':id', $contactId, PDO::PARAM_STR);
    $stmt->execute();
}

function insert_lead_for_contact(PDO $db, string $contactId, array $payload, string $nowIso): string {
    $title = $payload['title'] !== '' ? $payload['title'] : ($payload['service_label'] !== '' ? $payload['service_label'] : null);

    $leadNotes = [
        'origin' => $payload['origin'],
        'submitted_at' => $nowIso,
        'service_type' => $payload['service_type'],
        'service_label' => $payload['service_label'],
        'additional_notes' => $payload['additional_notes'],
        'fields' => $payload['extra_fields'],
    ];

    $sql = 'INSERT INTO leads (contact_id, title, source, status, notes, created_at, updated_at, last_contacted_at)
            VALUES (:contact_id, :title, :source, :status, :notes, :ts, :ts, :ts)
            RETURNING id';

    $stmt = $db->prepare($sql);
    $stmt->bindValue(':contact_id', $contactId, PDO::PARAM_STR);
    $stmt->bindValue(':title', $title, $title === null ? PDO::PARAM_NULL : PDO::PARAM_STR);
    $stmt->bindValue(':source', $payload['source'], PDO::PARAM_STR);
    $stmt->bindValue(':status', 'new', PDO::PARAM_STR);
    $stmt->bindValue(':notes', json_encode($leadNotes, JSON_UNESCAPED_SLASHES), PDO::PARAM_STR);
    $stmt->bindValue(':ts', $nowIso, PDO::PARAM_STR);
    $stmt->execute();

    $id = $stmt->fetchColumn();
    if ($id === false || $id === null) {
        throw new RuntimeException('Failed to create lead record.');
    }
    return (string) $id;
}

function create_lead_intake_from_payload(array $payload): array {
    $normalized = normalize_lead_intake_payload($payload);
    $db = get_db();
    $nowIso = gmdate('Y-m-d\TH:i:s\Z');

    $db->beginTransaction();
    try {
        $contactId = find_existing_contact_id($db, $normalized['email'], $normalized['phone']);

        if ($contactId === null) {
            $contactId = insert_lead_intake_contact($db, $normalized, $nowIso);
            $contactCreated = true;
        } else {
            touch_existing_contact($db, $contactId, $nowIso);
            $contactCreated = false;
        }

        $leadId = insert_lead_for_contact($db, $contactId, $normalized, $nowIso);
        $db->commit();
    } catch (Throwable $e) {
        if ($db->inTransaction()) {
            $db->rollBack();
        }
        throw $e;
    }

    return [
        'contact_id' => $contactId,
        'contact_created' => $contactCreated,
        'lead_id' => $leadId,
    ];
}
