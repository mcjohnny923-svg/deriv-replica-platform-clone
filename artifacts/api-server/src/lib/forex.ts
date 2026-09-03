// Fixed/approximate exchange rate, configurable via env var without a
// code change. Update KES_PER_USD_RATE on Render if the real rate drifts.
const DEFAULT_KES_PER_USD = 130;

export function getKesPerUsdRate(): number {
  const fromEnv = Number(process.env.KES_PER_USD_RATE);
  return Number.isFinite(fromEnv) && fromEnv > 0 ? fromEnv : DEFAULT_KES_PER_USD;
}

export function kesToUsd(kes: number): number {
  return kes / getKesPerUsdRate();
}

export function usdToKes(usd: number): number {
  return usd * getKesPerUsdRate();
}
