// In-memory, server-side "live price" per market symbol. This is the single
// source of truth: the frontend polls it for display, and trade settlement
// reads from the same state, so the number a user watches ticking is
// exactly what determines their trade's outcome.

import { getAssetBasePrice } from "./asset-base-prices";
import { pickWeightedDigit } from "./asset-digit-weights";

interface PriceState {
  price: number;
  lastTickAt: number;
  digitHistory: number[];
}

const priceStore = new Map<string, PriceState>();
const MAX_CATCHUP_TICKS = 5;
const HISTORY_LENGTH = 1000;

function buildInitialHistory(symbol: string): number[] {
  return Array.from({ length: HISTORY_LENGTH }, () => pickWeightedDigit(symbol));
}

function seedPrice(symbol: string): number {
  const base = getAssetBasePrice(symbol);
  return base + (Math.random() - 0.5) * base * 0.01;
}

// Step size scales with price so a ~0.65 forex pair and a ~65000 index
// both move by a sensible amount each tick, then the hundredths-place
// digit is overridden per the asset's own weighted distribution so each
// market's digit percentages look distinct over time.
function stepPrice(price: number, symbol: string): number {
  const change = (Math.random() - 0.5) * price * 0.0003;
  const rawNext = Math.max(0, price + change);
  const digit = pickWeightedDigit(symbol);
  const cents = Math.floor(rawNext * 100);
  const adjustedCents = cents - (cents % 10) + digit;
  return adjustedCents / 100;
}

export function getLivePrice(symbol: string): { price: number; digit: number; digitHistory: number[] } {
  const now = Date.now();
  let state = priceStore.get(symbol);

  if (!state) {
    state = {
      price: seedPrice(symbol),
      lastTickAt: now,
      digitHistory: buildInitialHistory(symbol),
    };
    priceStore.set(symbol, state);
  }

  const elapsedTicks = Math.floor((now - state.lastTickAt) / 1000);
  const ticksToApply = Math.min(elapsedTicks, MAX_CATCHUP_TICKS);

  for (let i = 0; i < ticksToApply; i++) {
    state.price = stepPrice(state.price, symbol);
    const cents = Math.round(state.price * 100);
    const tickDigit = Math.abs(cents % 10);
    state.digitHistory.push(tickDigit);
    if (state.digitHistory.length > HISTORY_LENGTH) {
      state.digitHistory.shift();
    }
  }
  if (ticksToApply > 0) {
    state.lastTickAt = now;
  }

  const cents = Math.round(state.price * 100);
  const digit = Math.abs(cents % 10);

  return { price: state.price, digit, digitHistory: state.digitHistory };
}
