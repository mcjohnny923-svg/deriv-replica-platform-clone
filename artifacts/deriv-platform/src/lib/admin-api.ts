import { API_BASE_URL } from "./api-config";

export interface AdminAccount {
  id: number;
  type: "demo" | "real";
  currency: string;
  balance: string;
}

export interface AdminUser {
  id: number;
  email: string;
  fullName: string | null;
  phoneNumber: string | null;
  createdAt: string;
  isSuspended: boolean;
  autoWithdraw: boolean;
  accounts: AdminAccount[];
}

export interface AdminPartnerReferredUser {
  id: number;
  email: string;
  fullName: string | null;
  createdAt: string;
  totalDeposited: string;
}

export interface AdminPartner {
  id: number;
  email: string;
  fullName: string | null;
  referralCode: string | null;
  signupsCount: number;
  totalCommission: string;
  referredUsers: AdminPartnerReferredUser[];
}

function authHeaders(adminKey: string): HeadersInit {
  return { "Content-Type": "application/json", "X-Admin-Key": adminKey };
}

export async function fetchAdminUsers(adminKey: string): Promise<AdminUser[]> {
  const res = await fetch(`${API_BASE_URL}/api/admin/users`, {
    headers: authHeaders(adminKey),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error ?? "Failed to load users");
  }
  return data.users;
}

export async function fetchAdminPartners(adminKey: string): Promise<AdminPartner[]> {
  const res = await fetch(`${API_BASE_URL}/api/admin/partners`, {
    headers: authHeaders(adminKey),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error ?? "Failed to load partners");
  }
  return data.partners;
}

export async function adjustUserBalance(
  adminKey: string,
  userId: number,
  input: { accountId: number; amount: number; note?: string },
): Promise<{ newBalance: string }> {
  const res = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/balance`, {
    method: "POST",
    headers: authHeaders(adminKey),
    body: JSON.stringify(input),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.formErrors?.[0] ?? data.error ?? "Failed to adjust balance");
  }
  return data;
}

export async function setUserSuspended(
  adminKey: string,
  userId: number,
  suspended: boolean,
): Promise<{ suspended: boolean }> {
  const res = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/suspend`, {
    method: "POST",
    headers: authHeaders(adminKey),
    body: JSON.stringify({ suspended }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error ?? "Failed to update suspension");
  }
  return data;
}

export async function setUserAutoWithdraw(
  adminKey: string,
  userId: number,
  autoWithdraw: boolean,
): Promise<{ autoWithdraw: boolean }> {
  const res = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/auto-withdraw`, {
    method: "POST",
    headers: authHeaders(adminKey),
    body: JSON.stringify({ autoWithdraw }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error ?? "Failed to update auto-withdraw setting");
  }
  return data;
}
