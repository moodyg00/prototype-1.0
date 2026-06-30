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

function hashToVector(text: string, dim: number): number[] {
  const out = new Array<number>(dim).fill(0);
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    out[i % dim] += (c * (i + 1)) / 65536;
  }
  const norm = Math.sqrt(out.reduce((s, v) => s + v * v, 0)) || 1;
  return out.map((v) => v / norm);
}