// Deterministic, per-asset digit bias so each market's digit-percentage
// distribution over time looks distinct from the others, instead of every
// asset converging toward a flat ~10% for every digit. Still random on
// each tick, just weighted differently per symbol.

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return hash >>> 0;
}

function mulberry32(seed: number) {
  let s = seed;
  return function () {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const weightsCache = new Map<string, number[]>();

export function getDigitWeights(symbol: string): number[] {
  const cached = weightsCache.get(symbol);
  if (cached) return cached;

  const rand = mulberry32(hashString(symbol));
  // Each digit gets a raw weight between 0.4 and 2.0 (up to 5x more likely
  // than another digit for the same asset), then normalized to sum to 1.
  const raw = Array.from({ length: 10 }, () => 0.4 + rand() * 1.6);
  const sum = raw.reduce((a, b) => a + b, 0);
  const weights = raw.map((v) => v / sum);

  weightsCache.set(symbol, weights);
  return weights;
}

export function pickWeightedDigit(symbol: string): number {
  const weights = getDigitWeights(symbol);
  const r = Math.random();
  let cumulative = 0;
  for (let digit = 0; digit < 10; digit++) {
    cumulative += weights[digit];
    if (r <= cumulative) return digit;
  }
  return 9;
}
