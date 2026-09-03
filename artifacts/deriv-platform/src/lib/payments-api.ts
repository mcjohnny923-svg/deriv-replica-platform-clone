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

export async function getExchangeRate(): Promise<ExchangeRateResponse> {
  return { rate: 130 };
}

export interface WithdrawResponse {
  status: "pending";
  message: string;
  transactionId: number;
  amountUsd: string;
  amountKes: number;
  newBalance: string;
}

export async function initiateWithdraw(input: {
  accountId: number;
  amountUsd: number;
}): Promise<WithdrawResponse> {
  const res = await fetch(`${API_BASE_URL}/api/payments/withdraw`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      accountId: input.accountId,
      amountUsd: input.amountUsd,
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.formErrors?.[0] ?? data.error ?? "Withdrawal failed to start");
  }
  return data;
}
