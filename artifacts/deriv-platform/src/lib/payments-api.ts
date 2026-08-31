import { API_BASE_URL } from "./api-config";
import { getToken } from "./auth-api";

export type DepositProvider = "mpesa" | "paystack" | "card";

export interface DepositInitResponse {
  status: "pending";
  message: string;
  checkoutRequestId: string;
  amountKes: number;
  estimatedUsd: string;
  rate: number;
  publicKey?: string;
  email?: string;
}

export interface DepositStatusResponse {
  status: "pending" | "completed" | "failed";
  amount: string;
  newBalance?: string;
}

function authHeaders(): HeadersInit {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function initiateDeposit(input: {
  accountId: number;
  amountKes: number;
  provider?: DepositProvider;
}): Promise<DepositInitResponse> {
  const res = await fetch(`${API_BASE_URL}/api/payments/deposit`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      accountId: input.accountId,
      amountKes: input.amountKes,
      provider: input.provider ?? "mpesa",
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.formErrors?.[0] ?? data.error ?? "Deposit failed to start");
  }
  return data;
}

export async function checkDepositStatus(reference: string): Promise<DepositStatusResponse> {
  const res = await fetch(
    `${API_BASE_URL}/api/payments/status?reference=${encodeURIComponent(reference)}`,
    { headers: authHeaders() },
  );
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error ?? "Failed to check deposit status");
  }
  return data;
}

export interface ExchangeRateResponse {
  rate: number;
}

// STUB: not backed by a real endpoint yet. Returns the same fixed rate
// used elsewhere (see KES_PER_USD in Deposit.tsx) so the UI shows a
// sensible number until a real withdrawal backend exists.
export async function getExchangeRate(): Promise<ExchangeRateResponse> {
  return { rate: 130 };
}

export interface WithdrawResponse {
  message: string;
}

// STUB: withdrawals are not implemented yet (no backend endpoint,
// no payout integration, no trade-since-deposit rule enforcement).
// Throws instead of faking success, since silently "succeeding" on a
// real money-out action would be actively misleading.
export async function initiateWithdraw(_input: {
  accountId: number;
  amountUsd: number;
}): Promise<WithdrawResponse> {
  throw new Error('Withdrawals are not available yet. Please check back soon.');
}
