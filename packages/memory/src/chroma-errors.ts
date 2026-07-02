export function isChromaConnectionError(message: string): boolean {
  return message.includes('Failed to connect to chromadb');
}

/** Short label for toasts and API `error` fields. */
export function chromaConnectionSummary(): string {
  const url = process.env.CHROMA_URL ?? 'http://localhost:8000';
  return `Chroma is not running at ${url}`;
}

/** Longer fix steps for logs or detail panels. */
export function chromaConnectionHint(): string {
  return (
    'From the repo root: pnpm dev:memory-stack (or pnpm docker:up / pnpm dev:chroma). ' +
    'Or in apps/agent/.env.local remove CHROMA_URL or set MEMORY_STORE=mock, then restart the agent app.'
  );
}

/** @deprecated Prefer chromaConnectionSummary + chromaConnectionHint */
export function formatChromaConnectionHelp(baseMessage: string): string {
  if (!isChromaConnectionError(baseMessage)) return baseMessage;
  return `${chromaConnectionSummary()}. ${chromaConnectionHint()}`;
}