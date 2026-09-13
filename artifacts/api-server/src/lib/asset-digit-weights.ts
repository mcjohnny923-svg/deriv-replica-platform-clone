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
  // Each digit gets a raw weight between 0.85 and 1.15 (a mild per-asset
  // flavor, not a real edge), then normalized to sum to 1. This keeps each
  // digit statistically close to a fair 10% - the kind of spread you'd
  // naturally see from ~1000 genuinely fair ticks (typically ~6%-12%) -
  // rather than a permanent, multiples-of-each-other bias. This matters
  // because the payout formula (10 / (winningDigitCount + 0.2)) assumes
  // each digit is close to fair odds; a wider bias here would make some
  // digits secretly much better or worse bets than the payout reflects.
  const raw = Array.from({ length: 10 }, () => 0.85 + rand() * 0.3);
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
