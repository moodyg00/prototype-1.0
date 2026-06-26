export function maskSecret(value: string | null | undefined): string {
  if (!value?.trim()) return '—';
  const trimmed = value.trim();
  if (trimmed.length <= 4) return '••••';
  return `••••${trimmed.slice(-4)}`;
}

/** @deprecated Use maskSecret */
export const maskCredentialValue = maskSecret;
