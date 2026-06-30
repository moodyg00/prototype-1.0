export interface Embedder {
  readonly dimension: number;
  embed(text: string): Promise<number[]>;
  embedMany(texts: string[]): Promise<number[][]>;
}

/** Deterministic stub vectors for scaffolding until a real model is configured. */
export class StubEmbedder implements Embedder {
  readonly dimension = 384;

  async embed(text: string): Promise<number[]> {
    return hashToVector(text, this.dimension);
  }

  async embedMany(texts: string[]): Promise<number[][]> {
    return Promise.all(texts.map((t) => this.embed(t)));
  }
}

/** OpenAI-compatible embeddings API (xAI, OpenAI, etc.). */
export class HttpEmbeddingEmbedder implements Embedder {
  readonly dimension: number;

  constructor(
    private options: {
      apiKey: string;
      baseUrl: string;
      model: string;
      dimension?: number;
    },
  ) {
    this.dimension = options.dimension ?? 1536;
  }

  async embed(text: string): Promise<number[]> {
    const [vec] = await this.embedMany([text]);
    return vec ?? hashToVector(text, this.dimension);
  }

  async embedMany(texts: string[]): Promise<number[][]> {
    if (!texts.length) return [];
    const res = await fetch(`${this.options.baseUrl.replace(/\/$/, '')}/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.options.apiKey}`,
      },
      body: JSON.stringify({ model: this.options.model, input: texts }),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Embeddings API ${res.status}: ${err.slice(0, 300)}`);
    }
    const json = (await res.json()) as {
      data?: Array<{ embedding: number[]; index: number }>;
    };
    const sorted = (json.data ?? []).sort((a, b) => a.index - b.index);
    return sorted.map((d) => d.embedding);
  }
}

let cached: Embedder | null = null;

export function getEmbedder(): Embedder {
  if (cached) return cached;

  const provider = (process.env.MEMORY_EMBED_PROVIDER ?? 'stub').toLowerCase();
  const model = process.env.MEMORY_EMBED_MODEL ?? 'text-embedding-3-small';

  if (provider === 'xai' && process.env.XAI_API_KEY) {
    cached = new HttpEmbeddingEmbedder({
      apiKey: process.env.XAI_API_KEY,
      baseUrl: process.env.XAI_BASE_URL ?? 'https://api.x.ai/v1',
      model: process.env.MEMORY_EMBED_MODEL ?? 'text-embedding-3-small',
      dimension: 1536,
    });
    return cached;
  }

  if (provider === 'openai' && process.env.OPENAI_API_KEY) {
    cached = new HttpEmbeddingEmbedder({
      apiKey: process.env.OPENAI_API_KEY,
      baseUrl: 'https://api.openai.com/v1',
      model,
      dimension: 1536,
    });
    return cached;
  }

  cached = new StubEmbedder();
  return cached;
}

export function resetEmbedderForTests(): void {
  cached = null;
}

function hashToVector(text: string, dim: number): number[] {
  const out = new Array<number>(dim).fill(0);
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    out[i % dim] += (c * (i + 1)) / 65536;
  }
  const norm = Math.sqrt(out.reduce((s, v) => s + v * v, 0)) || 1;
  return out.map((v) => v / norm);
}