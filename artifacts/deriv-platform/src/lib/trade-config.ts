export interface TradeTypeOption {
  value: string;
  label: string;
}

export const TRADE_TYPES: TradeTypeOption[] = [
  { value: 'rise_fall', label: 'Rise/Fall' },
  { value: 'higher_lower', label: 'Higher/Lower' },
  { value: 'touch_notouch', label: 'Touch/No Touch' },
  { value: 'in_out', label: 'In/Out' },
  { value: 'matches_differs', label: 'Matches/Differs' },
  { value: 'even_odd', label: 'Even/Odd' },
  { value: 'over_under', label: 'Over/Under' },
];

export const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

const PAYOUT_MULTIPLIERS: Record<string, number> = {
  rise_fall: 1.85,
  higher_lower: 1.75,
  touch_notouch: 1.75,
  in_out: 1.75,
  matches_differs: 9.5,
  even_odd: 1.95,
  over_under: 1.9,
};

export function calculatePayout(tradeType: string, stake: string): string {
  const stakeAmount = parseFloat(stake) || 0;
  const multiplier = PAYOUT_MULTIPLIERS[tradeType] ?? 1.75;
  return (stakeAmount * multiplier).toFixed(2);
}

export function isDigitContract(tradeType: string): boolean {
  return ['matches_differs', 'even_odd', 'over_under'].includes(tradeType);
}

export function needsDigitSelector(tradeType: string): boolean {
  return ['matches_differs', 'over_under'].includes(tradeType);
}
