const SENSITIVE_KEY = /^(api[_-]?key|password|secret|token|authorization|bearer|credential?s?)$/i;

export function maskPayloadObject(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(maskPayloadObject);
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      out[key] = SENSITIVE_KEY.test(key) ? '[REDACTED]' : maskPayloadObject(nested);
    }
    return out;
  }
  return value;
}

export function maskIntegrationPayload(payload: unknown, maxLength = 120): string {
  if (payload === null || payload === undefined) return '—';
  const json = JSON.stringify(maskPayloadObject(payload));
  if (json.length <= maxLength) return json;
  return `${json.slice(0, maxLength - 1)}…`;
}
