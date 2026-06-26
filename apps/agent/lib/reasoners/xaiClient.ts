/**
 * Minimal shared xAI client helper for prompt-based reasoners ("prompt agents").
 * Thin client for structured calls to xAI (used by the visual browser reasoner):
 *   - /v1/chat/completions
 *   - strict json_schema response_format
 *   - explicit reasoning_effort / temperature / top_p / max_output_tokens on EVERY call
 *   - x-grok-conv-id for potential prompt caching of system + skills
 *   - image_url (detail: low) only when provided
 *   - Always emit raw model response via optional callback (for EventStream debug)
 *
 * This is intentionally thin — no new abstractions that hide cost or hide the actual prompt.
 * Reasoners build their own tiny focused system + schema.
 */

export interface XaiCallOptions {
  apiKey: string;
  model?: string; // defaults to grok-4.3 (loaded elsewhere or overridden)
  system: string;
  userContent: any[]; // array of {type:'text', text:...} | {type:'image_url', image_url: {url, detail:'low'}}
  schemaName: string;
  schema: any; // json schema object (strict)
  inference: {
    reasoning_effort: 'low' | 'medium' | 'high';
    temperature: number;
    top_p: number;
    max_output_tokens: number;
  };
  cacheKey?: string; // becomes x-grok-conv-id
  // Called with the raw text content for observability (used by EventStream)
  onRawResponse?: (raw: string) => void;
  abortSignal?: AbortSignal;
}

export async function callXaiStructured<T = any>(opts: XaiCallOptions): Promise<T> {
  const model = opts.model || 'grok-4.3';
  const body: any = {
    model,
    messages: [
      { role: 'system', content: opts.system },
      { role: 'user', content: opts.userContent }
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: opts.schemaName,
        schema: opts.schema,
        strict: true
      }
    },
    reasoning_effort: opts.inference.reasoning_effort,
    temperature: opts.inference.temperature,
    top_p: opts.inference.top_p,
    max_output_tokens: opts.inference.max_output_tokens,
  };

  const cacheKey = opts.cacheKey || `reasoner-${Date.now()}`;

  const res = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${opts.apiKey}`,
      'Content-Type': 'application/json',
      'x-grok-conv-id': cacheKey,
    },
    body: JSON.stringify(body),
    signal: opts.abortSignal,
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`xAI error ${res.status}: ${txt}`);
  }

  const json = await res.json();
  const text = json.choices?.[0]?.message?.content || '';

  if (opts.onRawResponse) {
    opts.onRawResponse(text);
  }

  try {
    return JSON.parse(text) as T;
  } catch (e) {
    // Last-resort graceful fallback (reasoners should be strict, but surface the raw)
    return { thought: text, action: 'done', final_answer: text || 'Specialist produced no structured output.' } as any;
  }
}
