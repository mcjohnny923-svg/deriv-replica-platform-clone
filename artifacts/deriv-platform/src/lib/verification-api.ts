import { API_BASE_URL } from "./api-config";
import { getToken } from "./auth-api";

export interface VerificationDoc {
  id: number;
  docType: "identity" | "address";
  fileName: string;
  status: "pending" | "approved" | "rejected";
  rejectReason: string | null;
  createdAt: string;
}

export interface VerificationStatus {
  identity: VerificationDoc | null;
  address: VerificationDoc | null;
}

function authHeaders(): HeadersInit {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function getVerificationStatus(): Promise<VerificationStatus> {
  const res = await fetch(`${API_BASE_URL}/api/verification/status`, { headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Failed to load verification status");
  return data;
}

export async function uploadVerificationDoc(input: {
  docType: "identity" | "address";
  fileName: string;
  data: string;
}): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/verification/upload`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(input),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Upload failed");
}
