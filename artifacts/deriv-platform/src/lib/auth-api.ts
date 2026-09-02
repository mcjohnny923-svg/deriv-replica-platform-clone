import { API_BASE_URL } from "./api-config";

export interface AuthUser {
  id: number;
  email: string;
  fullName: string | null;
  createdAt: string;
  referralCode: string;
  phoneNumber: string | null;
}

export interface AuthAccount {
  id: number;
  userId: number;
  type: "demo" | "real";
  currency: string;
  balance: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
  accounts: AuthAccount[];
}

const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";
const ACCOUNTS_KEY = "auth_accounts";
const ACTIVE_TYPE_KEY = "auth_active_account_type";

export function saveAuth(data: AuthResponse) {
  localStorage.setItem(TOKEN_KEY, data.token);
  localStorage.setItem(USER_KEY, JSON.stringify(data.user));
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(data.accounts));
  if (!localStorage.getItem(ACTIVE_TYPE_KEY)) {
    localStorage.setItem(ACTIVE_TYPE_KEY, "demo");
  }
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): AuthUser | null {
  const raw = localStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function getStoredAccounts(): AuthAccount[] {
  const raw = localStorage.getItem(ACCOUNTS_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function getActiveAccountType(): "demo" | "real" {
  return (localStorage.getItem(ACTIVE_TYPE_KEY) as "demo" | "real") ?? "demo";
}

export function setActiveAccountType(type: "demo" | "real") {
  localStorage.setItem(ACTIVE_TYPE_KEY, type);
}

export function getStoredAccount(): AuthAccount | null {
  const accounts = getStoredAccounts();
  const activeType = getActiveAccountType();
  return accounts.find((a) => a.type === activeType) ?? accounts[0] ?? null;
}

export function updateStoredAccountBalance(balance: string) {
  const accounts = getStoredAccounts();
  const activeType = getActiveAccountType();
  const updated = accounts.map((a) => (a.type === activeType ? { ...a, balance } : a));
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(updated));
}

export function updateStoredUserPhone(phoneNumber: string) {
  const user = getStoredUser();
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify({ ...user, phoneNumber }));
  }
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(ACCOUNTS_KEY);
  localStorage.removeItem(ACTIVE_TYPE_KEY);
}

function authHeaders(): HeadersInit {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function registerUser(input: {
  email: string;
  password: string;
  fullName?: string;
  referralCode?: string;
  phoneNumber?: string;
}): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.formErrors?.[0] ?? data.error ?? "Registration failed");
  }
  return data;
}

export async function loginUser(input: {
  email: string;
  password: string;
}): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error ?? "Login failed");
  }
  return data;
}

export async function setPhoneNumber(phoneNumber: string): Promise<{ phoneNumber: string }> {
  const res = await fetch(`${API_BASE_URL}/api/auth/phone`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ phoneNumber }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.formErrors?.[0] ?? data.error ?? "Failed to save phone number");
  }
  return data;
}

export async function fetchAccounts(): Promise<AuthAccount[]> {
  const res = await fetch(`${API_BASE_URL}/api/auth/accounts`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error ?? "Failed to fetch accounts");
  }
  return data.accounts;
}

export async function refreshAccounts(): Promise<AuthAccount[]> {
  const accounts = await fetchAccounts();
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
  return accounts;
}

export async function resetDemoBalance(accountId: number): Promise<{ newBalance: string }> {
  const res = await fetch(`${API_BASE_URL}/api/auth/accounts/${accountId}/reset-demo`, {
    method: "POST",
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error ?? "Failed to reset demo balance");
  }
  return data;
}
