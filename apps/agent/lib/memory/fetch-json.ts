/** Parse JSON from a fetch Response; avoids \"Unexpected end of JSON input\" on empty bodies. */
export async function fetchJson<T = Record<string, unknown>>(url: string): Promise<T> {
  const res = await fetch(url);
  const text = await res.text();
  if (!text.trim()) {
    if (!res.ok) {
      throw new Error(`Request failed: ${url} (${res.status})`);
    }
    return {} as T;
  }
  let data: T;
  try {
    data = JSON.parse(text) as T;
  } catch {
    throw new Error(`Invalid JSON from ${url} (${res.status})`);
  }
  if (!res.ok) {
    const body = data as { error?: string; hint?: string };
    const err = body.error ?? `Request failed (${res.status})`;
    throw new Error(body.hint ? `${err} — ${body.hint}` : err);
  }
  return data;
}