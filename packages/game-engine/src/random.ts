export interface RandomResult {
  nextSeed: number;
  value: number;
}

export function nextRandom(seed: number): RandomResult {
  let nextSeed = seed + 0x6d2b79f5;
  nextSeed = Math.imul(nextSeed ^ (nextSeed >>> 15), nextSeed | 1);
  nextSeed ^= nextSeed + Math.imul(nextSeed ^ (nextSeed >>> 7), nextSeed | 61);
  const value = ((nextSeed ^ (nextSeed >>> 14)) >>> 0) / 4294967296;
  return { nextSeed, value };
}

export function randomIndex(length: number, seed: number): RandomResult {
  const result = nextRandom(seed);
  return {
    nextSeed: result.nextSeed,
    value: Math.floor(result.value * length),
  };
}
