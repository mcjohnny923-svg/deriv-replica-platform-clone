// Distinct starting price ranges per market, so each asset feels realistic
// and different from the others. Keyed by display asset name (not symbol),
// since the chart works with display names directly.
export const ASSET_BASE_PRICES: Record<string, number> = {
  'Volatility 10 Index': 6500,
  'Volatility 25 Index': 900,
  'Volatility 50 Index': 250,
  'Volatility 75 Index': 12545,
  'Volatility 100 Index': 1050,
  'Volatility 10 (1s) Index': 6500,
  'Volatility 15 (1s) Index': 15000,
  'Volatility 25 (1s) Index': 900,
  'Volatility 30 (1s) Index': 3000,
  'Volatility 50 (1s) Index': 250,
  'Volatility 75 (1s) Index': 65509,
  'Volatility 90 (1s) Index': 8000,
  'Volatility 100 (1s) Index': 1050,
  'EUR/USD': 1.085,
  'GBP/USD': 1.27,
  'USD/JPY': 149.5,
  'AUD/USD': 0.655,
};

export function getAssetBasePrice(assetName: string): number {
  return ASSET_BASE_PRICES[assetName] ?? 10000 + Math.random() * 5000;
}
