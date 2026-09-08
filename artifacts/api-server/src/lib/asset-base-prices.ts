// Distinct starting price ranges per market, so each asset feels realistic
// and different from the others (matching Deriv's actual differing ranges).
// Keyed by the symbol format assetToMarketInfo produces on the frontend
// (asset name, spaces -> underscores, uppercased).
export const ASSET_BASE_PRICES: Record<string, number> = {
  VOLATILITY_10_INDEX: 6500,
  VOLATILITY_25_INDEX: 900,
  VOLATILITY_50_INDEX: 250,
  VOLATILITY_75_INDEX: 12545,
  VOLATILITY_100_INDEX: 1050,
  'VOLATILITY_10_(1S)_INDEX': 6500,
  'VOLATILITY_15_(1S)_INDEX': 15000,
  'VOLATILITY_25_(1S)_INDEX': 900,
  'VOLATILITY_30_(1S)_INDEX': 3000,
  'VOLATILITY_50_(1S)_INDEX': 250,
  'VOLATILITY_75_(1S)_INDEX': 65509,
  'VOLATILITY_90_(1S)_INDEX': 8000,
  'VOLATILITY_100_(1S)_INDEX': 1050,
  'EUR/USD': 1.085,
  'GBP/USD': 1.27,
  'USD/JPY': 149.5,
  'AUD/USD': 0.655,
};

export function getAssetBasePrice(symbol: string): number {
  return ASSET_BASE_PRICES[symbol] ?? 10000 + Math.random() * 5000;
}
