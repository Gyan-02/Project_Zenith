const DIMENSIONS = 96;

function hashToken(token: string): number {
  let hash = 2_166_136_261;
  for (let index = 0; index < token.length; index += 1) {
    hash ^= token.charCodeAt(index);
    hash = Math.imul(hash, 16_777_619);
  }
  return hash >>> 0;
}

export function createDeterministicEmbedding(text: string): number[] {
  const vector = Array.from<number>({ length: DIMENSIONS }).fill(0);
  const tokens = text.toLowerCase().match(/[a-z0-9]+/g) ?? [];

  for (const token of tokens) {
    const hash = hashToken(token);
    const index = hash % DIMENSIONS;
    vector[index] = (vector[index] ?? 0) + (hash & 1 ? 1 : -1);
  }

  const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
  return magnitude === 0 ? vector : vector.map((value) => value / magnitude);
}
