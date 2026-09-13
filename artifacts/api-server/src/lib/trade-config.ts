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

// Number of digits (0-9) that count as a win for a given digit-contract
// direction/target. This must exactly mirror the win/loss check in
// settleDueTrades() in trades.ts, or the displayed/paid multiplier will
// stop matching the real win probability again.
export function getWinningDigitCount(direction: string, digit: number): number {
  if (direction === "over") return 9 - digit;   // e.g. Over 1 wins on 2-9 -> 8 digits
  if (direction === "under") return digit;      // e.g. Under 8 wins on 0-7 -> 8 digits
  if (direction === "matches") return 1;        // wins on exactly 1 digit
  if (direction === "differs") return 9;        // wins on all but 1 digit
  return 5; // even/odd - not used below, kept on flat table for now
}

export function getPayoutMultiplier(
  tradeType: string,
  direction?: string,
  digit?: number,
): number {
  if (tradeType === "over_under" || tradeType === "matches_differs") {
    const n = getWinningDigitCount(direction ?? "", digit ?? 0);
    if (n <= 0 || n >= 10) {
      // No possible winning outcome (e.g. Over 9, Under 0) - the frontend
      // must not offer these as selectable options.
      throw new Error(
        `Invalid digit selection for ${tradeType}: direction=${direction} digit=${digit} has no valid payout`,
      );
    }
    // Fair-odds multiplier scaled down slightly for house edge, derived
    // from the actual number of winning digits out of 10 - NOT a flat
    // per-trade-type rate. See trade-config discussion for derivation.
    return 10 / (n + 0.2);
  }
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
