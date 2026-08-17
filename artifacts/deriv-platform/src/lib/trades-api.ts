import { API_BASE_URL } from "./api-config";
import { getToken } from "./auth-api";

export interface Trade {
  id: number;
  accountId: number;
  marketId: number;
  tradeType: string;
  direction: string;
  digit: number | null;
  stake: string;
  payoutMultiplier: string;
  entryPrice: string;
  exitPrice: string | null;
  payout: string | null;
  status: "open" | "won" | "lost";
  openedAt: string;
  settlesAt: string;
  closedAt: string | null;
  market?: { symbol: string; displayName: string; category: string };
}

export interface BuyTradeInput {
  accountId: number;
  marketSymbol: string;
  marketDisplayName: string;
  marketCategory: string;
  tradeType: string;
  direction: string;
  digit?: number;
  stake: number;
  durationValue: number;
  durationUnit: "t" | "s" | "m";
}

function authHeaders(): HeadersInit {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function buyTrade(input: BuyTradeInput): Promise<{ trade: Trade; newBalance: string }> {
  const res = await fetch(`${API_BASE_URL}/api/trades/buy`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(input),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.formErrors?.[0] ?? data.error ?? "Failed to place trade");
  }
  return data;
}

export async function getOpenTrades(accountId: number): Promise<{ openTrades: Trade[]; balance: string }> {
  const res = await fetch(`${API_BASE_URL}/api/trades/open?accountId=${accountId}`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error ?? "Failed to load open trades");
  }
  return data;
}

export async function getTradeHistory(accountId: number): Promise<{ closedTrades: Trade[] }> {
  const res = await fetch(`${API_BASE_URL}/api/trades/history?accountId=${accountId}`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error ?? "Failed to load trade history");
  }
  return data;
}
