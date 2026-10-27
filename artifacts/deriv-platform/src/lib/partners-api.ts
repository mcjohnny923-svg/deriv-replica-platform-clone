import { API_BASE_URL } from "./api-config";
import { getToken } from "./auth-api";

export interface PartnerSummary {
  referralCode: string;
  signupsCount: number;
  totalEarnings: string;
  thisMonthEarnings: string;
  tradesCommissioned: number;
  availableBalance: string;
  pendingWithdrawal: string;
  paidOut: string;
  minWithdrawal: number;
}

function authHeaders(): HeadersInit {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function getPartnerSummary(): Promise<PartnerSummary> {
  const res = await fetch(`${API_BASE_URL}/api/partners/summary`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error ?? "Failed to load partner summary");
  }
  return data;
}

export async function requestPartnerWithdrawal(): Promise<{ amount: string }> {
  const res = await fetch(`${API_BASE_URL}/api/partners/withdraw`, {
    method: "POST",
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error ?? "Failed to request withdrawal");
  }
  return data;
}
