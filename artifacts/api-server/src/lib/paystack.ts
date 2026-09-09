import { createHmac, timingSafeEqual } from "node:crypto";

const PAYSTACK_BASE_URL = "https://api.paystack.co";
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

export interface PaystackInitResult {
  ok: boolean;
  authorizationUrl?: string;
  accessCode?: string;
  reference?: string;
  error?: string;
}

export async function initiatePaystackTransaction(input: {
  email: string;
  amountKes: number;
  reference: string;
  callbackUrl?: string;
  channels?: ("card" | "mobile_money" | "bank" | "ussd")[];
}): Promise<PaystackInitResult> {
  if (!PAYSTACK_SECRET_KEY) {
    return { ok: false, error: "PAYSTACK integration not configured" };
  }
  try {
    const res = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      },
      body: JSON.stringify({
        email: input.email,
        amount: Math.round(input.amountKes * 100),
        currency: "KES",
        reference: input.reference,
        callback_url: input.callbackUrl,
        channels: input.channels ?? ["card", "mobile_money"],
      }),
    });
    const data: any = await res.json();
    if (!res.ok || !data.status) {
      return { ok: false, error: data.message ?? `PAYSTACK returned ${res.status}` };
    }
    return {
      ok: true,
      authorizationUrl: data.data.authorization_url,
      accessCode: data.data.access_code,
      reference: data.data.reference,
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Request to PAYSTACK failed" };
  }
}

export interface PaystackVerifyResult {
  ok: boolean;
  status?: "success" | "failed" | "abandoned";
  amountKes?: number;
  channel?: string;
  error?: string;
}

export async function verifyPaystackTransaction(reference: string): Promise<PaystackVerifyResult> {
  if (!PAYSTACK_SECRET_KEY) {
    return { ok: false, error: "PAYSTACK integration not configured" };
  }
  try {
    const res = await fetch(`${PAYSTACK_BASE_URL}/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` },
    });
    const data: any = await res.json();
    if (!res.ok || !data.status) {
      return { ok: false, error: data.message ?? `PAYSTACK returned ${res.status}` };
    }
    return {
      ok: true,
      status: data.data.status,
      amountKes: data.data.amount / 100,
      channel: data.data.channel,
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Request to PAYSTACK failed" };
  }
}

export function verifyPaystackSignature(rawBody: string, signature: string | undefined): boolean {
  if (!PAYSTACK_SECRET_KEY || !signature) return false;
  const expected = createHmac("sha512", PAYSTACK_SECRET_KEY).update(rawBody, "utf8").digest("hex");
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export interface PaystackWebhookPayload {
  event: "charge.success" | "charge.failed" | string;
  data: {
    reference: string;
    status: "success" | "failed" | "abandoned";
    amount: number;
    currency: string;
    channel: string;
    customer: { email: string };
  };
}
