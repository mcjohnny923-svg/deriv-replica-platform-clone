export const PAYOUT_MULTIPLIERS: Record<string, number> = {
  rise_fall: 1.85,
  higher_lower: 1.75,
  touch_notouch: 1.75,
  in_out: 1.75,
  matches_differs: 9.5,
  even_odd: 1.95,
  over_under: 1.9,
};

// Implied win probability derived from each payout multiplier
// (roughly: probability * multiplier ≈ 1, house edge included)
export const WIN_PROBABILITIES: Record<string, number> = {
  rise_fall: 0.5,
  higher_lower: 0.52,
  touch_notouch: 0.52,
  in_out: 0.52,
  matches_differs: 0.1,
  even_odd: 0.48,
  over_under: 0.5,
};

export const DIGIT_TRADE_TYPES = ["matches_differs", "even_odd", "over_under"];

export function isDigitContract(tradeType: string): boolean {
  return DIGIT_TRADE_TYPES.includes(tradeType);
}

export function getPayoutMultiplier(tradeType: string): number {
  return PAYOUT_MULTIPLIERS[tradeType] ?? 1.75;
}

export function getWinProbability(tradeType: string): number {
  return WIN_PROBABILITIES[tradeType] ?? 0.5;
}

// Duration unit -> seconds per unit
export function durationToSeconds(value: number, unit: string): number {
  const perUnit: Record<string, number> = { t: 1, s: 1, m: 60 };
  return value * (perUnit[unit] ?? 1);
}
