import { API_BASE_URL } from "./api-config";
import { getToken } from "./auth-api";

export type DepositProvider = "mpesa" | "paystack";

export interface DepositInitResponse {
  status: "pending";
  message: string;
  checkoutRequestId: string;
  amountKes: number;
  estimatedUsd: string;
  rate: number;
}

export interface DepositStatusResponse {
  status: "pending" | "completed" | "failed";
  amount: string;
  newBalance?: string;
}

export interface WithdrawResponse {
  status: "pending";
  message: string;
  amountUsd: number;
  newBalance: string;
}

export interface RateResponse {
  rate: number;
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

export async function initiateWithdraw(input: {
  accountId: number;
  amountUsd: number;
}): Promise<WithdrawResponse> {
  const res = await fetch(`${API_BASE_URL}/api/payments/withdraw`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(input),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.formErrors?.[0] ?? data.error ?? "Withdrawal failed to start");
  }
  return data;
}

export async function getExchangeRate(): Promise<RateResponse> {
  const res = await fetch(`${API_BASE_URL}/api/payments/rate`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error ?? "Failed to fetch exchange rate");
  }
  return data;
}
