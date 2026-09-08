// In-memory, server-side "live price" per market symbol. This is the single
// source of truth: the frontend polls it for display, and trade settlement
// reads from the same state, so the number a user watches ticking is
// exactly what determines their trade's outcome.

import { getAssetBasePrice } from "./asset-base-prices";

interface PriceState {
  price: number;
  lastTickAt: number;
}

const priceStore = new Map<string, PriceState>();
const MAX_CATCHUP_TICKS = 5;

function seedPrice(symbol: string): number {
  const base = getAssetBasePrice(symbol);
  return base + (Math.random() - 0.5) * base * 0.01;
}

function stepPrice(price: number): number {
  const change = (Math.random() - 0.5) * 3;
  return Math.max(0, price + change);
}

export function getLivePrice(symbol: string): { price: number; digit: number } {
  const now = Date.now();
  let state = priceStore.get(symbol);

  if (!state) {
    state = { price: seedPrice(symbol), lastTickAt: now };
    priceStore.set(symbol, state);
  }

  const elapsedTicks = Math.floor((now - state.lastTickAt) / 1000);
  const ticksToApply = Math.min(elapsedTicks, MAX_CATCHUP_TICKS);

  for (let i = 0; i < ticksToApply; i++) {
    state.price = stepPrice(state.price);
  }
  if (ticksToApply > 0) {
    state.lastTickAt = now;
  }

  const cents = Math.round(state.price * 100);
  const digit = Math.abs(cents % 10);

  return { price: state.price, digit };
}
