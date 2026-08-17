import { API_BASE_URL } from "./api-config";

export interface AuthUser {
  id: number;
  email: string;
  fullName: string | null;
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
  account?: AuthAccount;
  accounts?: AuthAccount[];
}

const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";
const ACCOUNT_KEY = "auth_account";

export function saveAuth(data: AuthResponse) {
  localStorage.setItem(TOKEN_KEY, data.token);
  localStorage.setItem(USER_KEY, JSON.stringify(data.user));
  const account = data.account ?? data.accounts?.[0];
  if (account) {
    localStorage.setItem(ACCOUNT_KEY, JSON.stringify(account));
  }
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): AuthUser | null {
  const raw = localStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function getStoredAccount(): AuthAccount | null {
  const raw = localStorage.getItem(ACCOUNT_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function updateStoredAccountBalance(balance: string) {
  const account = getStoredAccount();
  if (account) {
    localStorage.setItem(ACCOUNT_KEY, JSON.stringify({ ...account, balance }));
  }
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(ACCOUNT_KEY);
}

export async function registerUser(input: {
  email: string;
  password: string;
  fullName?: string;
  accountType: "demo" | "real";
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
