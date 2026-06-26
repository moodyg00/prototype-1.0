<?php

function integration_slugify(string $value): string {
    $normalized = strtolower(trim($value));
    $normalized = preg_replace('/[^a-z0-9]+/', '-', $normalized) ?? '';

    return trim($normalized, '-');
}

function get_base_integration_service_catalog(): array {
    return [
        'gmail' => 'Gmail',
        'grok' => 'Grok',
        'chat-gpt' => 'Chat GPT',
        'meta' => 'Meta',
        'facebook' => 'Facebook',
        'instagram' => 'Instagram',
        'ad-words' => 'Ad Words',
        'analytics' => 'Analytics',
        'nextdoor' => 'Nextdoor',
        'craigslist' => 'Craigslist',
        'open-source' => 'Open Source',
        'third-party' => '3rd Party',
    ];
}

function get_integration_type_catalog(): array {
    return [
        'snippet' => 'Snippet',
        'webhook' => 'Webhook',
        'api-keys' => 'API Keys',
        'credentials' => 'Credentials',
        'passkeys' => 'Passkeys',
        'wireframes' => 'Wireframes',
    ];
}

function get_integration_type_data_templates(): array {
    return [
        'snippet' => [
            'language' => 'html',
            'placement' => 'head',
            'content' => '<script src="https://example.com/snippet.js"></script>',
        ],
        'webhook' => [
            'endpoint' => 'https://example.com/webhooks/integration',
            'event_types' => ['lead.created', 'lead.updated'],
        ],
        'api-keys' => [
            'api_key' => 'replace-me',
            'label' => 'Production key',
        ],
        'credentials' => [
            'username' => 'service-user',
            'password' => 'replace-me',
        ],
        'passkeys' => [
            'key_id' => 'passkey-id',
            'public_key' => 'replace-me',
        ],
        'wireframes' => [
            'title' => 'Integration wireframe',
            'notes' => 'Describe the flow and required UI states here.',
        ],
    ];
}

function get_integration_type_help_text(): array {
    return [
        'snippet' => 'Use JSON with language, placement, and content so snippets stay documented and portable.',
        'webhook' => 'Use JSON with endpoint and event_types. event_types must be an array of event names.',
        'api-keys' => 'Use JSON with api_key plus an optional label or environment.',
        'credentials' => 'Use JSON with username and password keys.',
        'passkeys' => 'Use JSON with key_id and public_key.',
        'wireframes' => 'Use JSON with title and notes so UI planning stays searchable.',
    ];
}

function get_integration_storage_directories(): array {
    return [
        'endpoints' => '/data/integrations/endpoints',
        'keys' => '/data/integrations/keys',
    ];
}
