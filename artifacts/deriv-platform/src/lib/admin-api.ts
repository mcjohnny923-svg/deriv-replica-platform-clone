import { API_BASE_URL } from "./api-config";

export interface AdminAccount {
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
  accounts: AdminAccount[];
}

export async function fetchAdminUsers(adminKey: string): Promise<AdminUser[]> {
  const res = await fetch(`${API_BASE_URL}/api/admin/users`, {
    headers: { "X-Admin-Key": adminKey },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error ?? "Failed to load users");
  }
  return data.users;
}
