import { API_BASE_URL } from "./api-config";

export interface AuthUser {
  id: number;
  email: string;
  fullName: string | null;
  createdAt: string;
  referralCode: string;
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

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(ACCOUNTS_KEY);
  localStorage.removeItem(ACTIVE_TYPE_KEY);
}

export async function registerUser(input: {
  email: string;
  password: string;
  fullName?: string;
  referralCode?: string;
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
